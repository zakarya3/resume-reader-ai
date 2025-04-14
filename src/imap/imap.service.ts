// email.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Imap from 'imap';
import { inspect } from 'util';

@Injectable()
export class EmailService implements OnModuleInit {
  private imap: Imap;

  constructor() {
    this.imap = new Imap({
      user: 'zakaria.aanni@gmail.com',
      password: 'wrpd ghec usnp lowe',
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });
  }

  onModuleInit() {
    // You can automatically connect when the service initializes
    void this.connect();
  }

  private openInbox(cb: (err: Error, box: Imap.Box) => void): void {
    this.imap.openBox('INBOX', true, cb);
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.setupListeners();

      this.imap.once('ready', () => {
        this.fetchEmails('Test Subject')
          .then(() => resolve())
          .catch((err) => reject(err));
      });

      this.imap.connect();
    });
  }

  private setupListeners(): void {
    this.imap.once('error', (err: Error) => {
      console.log('IMAP error:', err);
    });

    this.imap.once('end', () => {
      console.log('Connection ended');
    });
  }

  private fetchEmails(targetSubject: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.openInbox((err, box) => {
        if (err) {
          reject(err);
          return;
        }

        const today = new Date();
        const dateStr = today
          .toLocaleString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
          .replace(/,/g, '');

        this.imap.search([['SINCE', dateStr]], (err, results) => {
          if (err || !results || results.length === 0) {
            console.log('No messages found.');
            resolve();
            return;
          }

          const fetch = this.imap.fetch(results, {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
            struct: true,
          });

          fetch.on('message', (msg, seqno) => {
            let subject = '';
            let body = '';

            msg.on('body', (stream, info) => {
              let buffer = '';
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });

              stream.once('end', () => {
                if (info.which?.startsWith('HEADER')) {
                  const parsed = Imap.parseHeader(buffer);
                  subject = parsed.subject?.[0] || '';
                } else if (info.which === 'TEXT') {
                  body = buffer;
                }
              });
            });

            msg.once('end', () => {
              if (subject.includes(targetSubject)) {
                console.log(`🎯 Match found (#${seqno})`);
                console.log('📧 Subject:', subject);
                console.log('📝 Body:\n', body);
              }
            });
          });

          fetch.once('error', (err) => {
            console.error('Fetch error:', err);
            reject(err);
          });

          fetch.once('end', () => {
            console.log('✅ Done fetching emails with bodies');
            resolve();
          });
        });
      });
    });
  }

  // Add more methods as needed, such as:
  //   public getLatestEmails(count: number = 3): any[] {
  //     // Implementation to return parsed emails
  //     return [];
  //   }

  public disconnect(): void {
    if (this.imap && this.imap.state !== 'disconnected') {
      this.imap.end();
    }
  }
}
