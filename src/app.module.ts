import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailService } from './imap/imap.service';
// import { ImapConfig, ImapModule } from 'nestjs-imap';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, EmailService],
})
export class AppModule {}
