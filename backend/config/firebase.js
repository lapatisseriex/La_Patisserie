import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Debug environment variables
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_PRIVATE_KEY length:', process.env.FIREBASE_PRIVATE_KEY?.length);
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);

// Create service account credential from environment variables
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCNpwC/vqVEdVNs
DTv8930Sa4LOSd7bySK5coTGMcs6uzMuM6eODkZBZF/UN6oXyqImCFnV9A4coaUS
eHLZRR4jSOL7EajhFTHeUhDdX35EOuTb4s39rmI9BAvlomFa3UtSU/26qA2tgJQQ
74Gx1bHh/VRB0iyhltKWPE967D9077NImIiWWJXQtnxw5qH9tWJ9Ia+3iEih80+Y
yWq1XYAsE7VA+9ZYGl0fx/Yee+lOxZzFJhfTfsLDrGrzwKDPB+Ug446o5jOfU9Bj
/NjNM7JPngpJMFmVaGZqiitl5PNubMIXSea3VE1Lak10f4fPC0gmthdtQTkq8EA8
MxXl0J/nAgMBAAECggEAMVRyX1QeK9wMBDoLpQnvJYYJVJvHH5VJIXnvITJgCwD8
Tt+wPzlbYBR7huUnuAdaNpJ77pWCgJgOa4NEw8NdPn54hWTeAhymdDzyIJXL3CkC
YEz43ZpoHcWV+w90hfdA7tfPKbyynrSDW+58pRi9TO0y9YUjA9cJWUaBi1ZQtwDq
K88XUH2wm13RR7NuDVzi5NJyVbmkRLIiHI03FNdH6AH30jH/2Fcg1Fa+koqxYWS2
Lv/raDmMCHHn1r+dZWrI4ynGjNmeT0F2InfDIjMhB3in1dicffLxSIrB0hfg/40p
Mf84LaWZib4KzIFXqpmiSUIfzSaZJgL0rBS0rWlemQKBgQDC/vnX151R4XCaqdM1
2bjR9rsUCVPsXBibiYl2S87VjUCc/eW13IUX1Y9iULLx77aP3eVTzGFGPH7hUerg
2AJAjPH36pjpJQCwjYfn5pSQDOtA1cj6pjWvhfhRdKyEXNQB24MjEQpXqbwb7gHp
gV/NgaYVlPhLuHXc3WgoANhsJQKBgQC598psU9jU5j0dSbWelatI+gISEkfa8J0a
ZMBhJZ0D+yavF4imRbtTw/jyGZLbh8ZKxFhlFmpUXGXakJ+VILZy/T06BMZfvwen
VkAdVLMs9GAVFGpRKkWZ0Ec2AtWI4oeGWnA5m0ENI1bxhxKHs8intwQVR8lBS/sj
O4MCmWbYGwKBgQDCgIkARn8S/JdQftNB5MGZFc33p3JB0n9tLdyi1e0jUHlB33Qx
Whyb8JbMT4ifESf+Cy1D0Bq7b350DD0IOA7PCogVbblG3XT5psMIixRnN6u1iUmm
0wG76hsOTR4EDYAftjDxWn8BgDo1dcwMedLw70CWSHj/NqjCPUs2k9lMzQKBgGiT
tZtRU1/10WxE5QM2+0lgfgWXjhzKri4Hdj+rHS797vULcOa/0+X5EGdkhjc5lQK6
g1LlVgn2o7hTF8qOyMrFKccUpFF3ZWBumkNkPBYNnnJ8NoVKFjW28DSpR1dgvAGL
ngxnCB/RPbU41ezF5xKZUox8/+neRm27q6KsjS79AoGBAKeomO4Nl8D/lkiFsIuq
FYbAxhYLyhDVX5bJQVvijfDxuitj+Kiy5ap0TccrRSRF7uIs1Lo8D5ydROUJDl7i
DhgA3Tb5Id9uWQVmmb4qOVhFhGU8xf+sDSZWGRaYsrqyfQJC2Gxnaa13zZGhoIGy
fBw/M/sDgFNyKBVrDsIkqAPh
-----END PRIVATE KEY-----`,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40${process.env.FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`,
  universe_domain: "googleapis.com"
};

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export default admin;
