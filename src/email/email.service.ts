import { Injectable } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailTracking } from './schema/email.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EmailService {
    private sesClient: SESClient;

    constructor(
        private configService: ConfigService,
        @InjectRepository(EmailTracking)
        private emailTrackingRepository: Repository<EmailTracking>,
    ) {
        const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
        const region = this.configService.get<string>('AWS_REGION');

        this.sesClient = new SESClient({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey
            },
        });
    }

    async sendEmail(to: string[], subject: string, body: string): Promise<{ responseIds: string[], errors: string[] }> {
        if (!to || to.length == 0) {
            throw new Error('At least one Receiver\'s email is required');
        }
        if (!subject || !body) {
            throw new Error('Subject and body are required');
        }

        const responseIds: string[] = [];
        const errors: string[] = [];

        for (const recipient of to) {
            const params = {
                Source: this.configService.get<string>('SENDER_EMAIL'),
                Destination: {
                    ToAddresses: [recipient],
                },
                Message: {
                    Subject: {
                        Data: subject,
                        Charset: 'UTF-8',
                    },
                    Body: {
                        Html: {
                            Data: body,
                            Charset: 'UTF-8',
                        },
                        Text: {
                            Data: body,
                            Charset: 'UTF-8',
                        },
                    },
                },
            }

            try {
                const command = new SendEmailCommand(params);
                const response = await this.sesClient.send(command);
                console.log(`Email sent successfully to ${recipient}`);
                responseIds.push(response.$metadata.requestId);

                await this.trackEmail(recipient, 'Sent');
            } catch (error) {
                console.error(`Error sending email to ${recipient}:`, error);
                errors.push(`Failed to send email to ${recipient}: ${error.message}`);

                await this.trackEmail(recipient, 'Bounced');
            }
        }

        return { responseIds, errors };
    };

    async trackEmail(email: string, status: string): Promise<void> {
        const emailTracking = this.emailTrackingRepository.create({ email, status });
        await this.emailTrackingRepository.save(emailTracking);
    }

    async incrementOpenCount(email: string): Promise<void> {
        await this.emailTrackingRepository.increment({ email }, 'timesOpened', 1);
    }

    async handleDelivery(email: string): Promise<void> {
        await this.trackEmail(email, 'Delivered');
    }

    async handleBounce(email: string): Promise<void> {
        await this.trackEmail(email, 'Bounced');
    }

    async getAllEmailTracking(): Promise<EmailTracking[]> {
        return await this.emailTrackingRepository.find();
    }
}