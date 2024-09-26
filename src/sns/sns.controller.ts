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
        // console.log(req.body);

        if (snsMessageType === 'SubscriptionConfirmation') {
            const parsedBody = req.body;

            const subscribeUrl = parsedBody.SubscribeURL;
            if (!subscribeUrl) {
                console.error('Missing Subscribe URL in the body:', parsedBody);
                return res.status(HttpStatus.BAD_REQUEST).json({
                    message: 'Failed to confirm subscription. Missing Subscribe URL in the body.',
                    error: parsedBody,
                });
            }

            console.log('Visiting Subscribe URL:', subscribeUrl);
            await axios.get(subscribeUrl);
            console.log('Subscription confirmed via Subscribe URL:', subscribeUrl);

            return res.status(HttpStatus.OK).json({
                message: 'Subscription confirmed',
                body: parsedBody,
            });
        }

        if (snsMessageType === 'Notification') {
            const notificationMessage = JSON.parse(req.body.Message);

            if (!notificationMessage) {
                console.error('Invalid notification message:', req.body);
                return res.status(HttpStatus.BAD_REQUEST).json({
                    message: 'Invalid SNS notification message.',
                });
            }

            const eventType = notificationMessage.eventType;
            const recipients = notificationMessage.mail.destination;

            try {
                switch (eventType) {
                    case 'SEND':
                        for (const recipient of recipients) {
                            await this.emailService.handleDelivery(recipient);
                        }
                        break;

                    case 'BOUNCE':
                        const bouncedRecipients = notificationMessage.bounce.bouncedRecipients;
                        for (const recipient of bouncedRecipients) {
                            await this.emailService.handleBounce(recipient.emailAddress);
                        }
                        break;

                    case 'OPEN':
                        for (const recipient of recipients) {
                            await this.emailService.incrementOpenCount(recipient);
                        }
                        break;

                    default:
                        console.error('Unrecognized notification event type:', eventType);
                        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Unrecognized event type' });
                }

                return res.status(HttpStatus.OK).send();
            } catch (error) {
                console.error('Error processing SNS notification:', error);
                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                    message: 'Failed to process SNS notification.',
                    error: error.message,
                });
            }
        }

        console.error('Unrecognized message type:', snsMessageType);
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Unrecognized message type' });
    }
}
