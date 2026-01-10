import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FirebaseConfigService } from '../../config/firebase.config';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        FirebaseConfigService,
        {
            provide: 'FIREBASE_FIRESTORE',
            useFactory: () => {
                if (!admin.apps.length) {
                    admin.initializeApp({
                        credential: admin.credential.applicationDefault(),
                    });
                }
                return admin.firestore();
            },
        },
        {
            provide: 'FIREBASE_AUTH',
            useFactory: () => {
                if (!admin.apps.length) {
                    admin.initializeApp({
                        credential: admin.credential.applicationDefault(),
                    });
                }
                return admin.auth();
            },
        },
    ],
    exports: ['FIREBASE_FIRESTORE', 'FIREBASE_AUTH', FirebaseConfigService],
})
export class FirebaseModule { }
