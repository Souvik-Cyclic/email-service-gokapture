import { Injectable } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
    private sesClient: SESClient;

    constructor(private configService: ConfigService) {
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
            } catch (error) {
                console.error(`Error sending email to ${recipient}:`, error);
                errors.push(`Failed to send email to ${recipient}: ${error.message}`);
            }
        }

        return { responseIds, errors };
    };


}