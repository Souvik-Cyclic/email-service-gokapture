import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SNSClient } from '@aws-sdk/client-sns';

@Injectable()
export class SnsService {
    private snsClient: SNSClient;

    constructor(private configService: ConfigService) {
        this.snsClient = new SNSClient({
            region: this.configService.get<string>('AWS_REGION'),
        });
    }
}
