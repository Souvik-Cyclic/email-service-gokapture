import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
    constructor(private readonly emailService: EmailService) { }

    @Post('send')
    async sendEmail(
        @Body('to') to: string[],
        @Body('subject') subject: string,
        @Body('body') body: string,
    ): Promise<{ message: string, responseIds?: string[], errors?: string[] }> {
        try {
            const { responseIds, errors } = await this.emailService.sendEmail(to, subject, body);
            return {
                message: 'Email sent successfully',
                responseIds,
                errors
            };
        } catch (error) {
            return {
                message: `Failed to send email: ${error.message}`,
                errors: [error.message],
            }
        }
    }
}