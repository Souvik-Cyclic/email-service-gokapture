import { Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { SnsService } from './sns.service';
import { EmailService } from '../email/email.service';
import axios from 'axios';

@Controller('sns')
export class SnsController {
    constructor(
        private readonly snsService: SnsService,
        private readonly emailService: EmailService,
    ) {}

    @Post('subscribe')
    async handleSns(@Req() req: any, @Res() res: any) {
        const snsMessageType = req.headers['x-amz-sns-message-type'];

        if (snsMessageType === 'SubscriptionConfirmation') {
            let rawBody = '';

            req.on('data', (chunk: string) => {
                rawBody += chunk;
            });

            req.on('end', async () => {
                try {
                    const parsedBody = JSON.parse(rawBody);
                    const subscribeUrl = parsedBody.SubscribeURL;

                    if (!subscribeUrl) {
                        console.error('Missing Subscribe URL in the body:', rawBody);
                        return res.status(HttpStatus.BAD_REQUEST).json({
                            message: 'Failed to confirm subscription. Missing Subscribe URL in the body.',
                            error: rawBody,
                        });
                    }

                    console.log('Visiting Subscribe URL:', subscribeUrl);
                    await axios.get(subscribeUrl);
                    console.log('Subscription confirmed via Subscribe URL:', subscribeUrl);

                    return res.status(HttpStatus.OK).json({
                        message: 'Subscription confirmed',
                        body: parsedBody,
                    });
                } catch (error) {
                    console.error('Error parsing raw body:', error);
                    return res.status(HttpStatus.BAD_REQUEST).json({
                        message: 'Invalid message format',
                        error: rawBody,
                    });
                }
            });
            return;
        }

        if (snsMessageType === 'Notification') {
            let rawBody = '';

            req.on('data', (chunk: string) => {
                rawBody += chunk;
            });

            req.on('end', async () => {
                try {
                    const message = JSON.parse(rawBody);
                    const notificationType = message.Type;

                    switch (notificationType) {
                        case 'Notification':
                            const notificationMessage = JSON.parse(message.Message);

                            // Handle different types of email events
                            if (notificationMessage.eventType === 'SEND') {
                                const recipients = notificationMessage.mail.destination;
                                for (const recipient of recipients) {
                                    await this.emailService.handleDelivery(recipient);
                                }
                            } else if (notificationMessage.eventType === 'BOUNCE') {
                                const bouncedRecipients = notificationMessage.bounce.bouncedRecipients;
                                for (const recipient of bouncedRecipients) {
                                    await this.emailService.handleBounce(recipient.emailAddress);
                                }
                            } else if (notificationMessage.eventType === 'OPEN') {
                                const recipients = notificationMessage.mail.destination;
                                for (const recipient of recipients) {
                                    await this.emailService.incrementOpenCount(recipient);
                                }
                            } else {
                                console.error('Unrecognized notification event type:', notificationMessage.eventType);
                            }
                            break;

                        default:
                            console.error('Unrecognized SNS notification type:', notificationType);
                    }
                    return res.status(HttpStatus.OK).send();
                } catch (error) {
                    console.error('Error processing SNS notification:', error);
                    return res.status(HttpStatus.BAD_REQUEST).json({
                        message: 'Failed to process SNS notification.',
                        error: rawBody,
                    });
                }
            });
            return;
        }

        console.error('Unrecognized message type:', snsMessageType);
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Unrecognized message type' });
    }
}
