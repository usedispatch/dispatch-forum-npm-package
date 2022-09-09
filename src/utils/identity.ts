import { PublicKey } from '@solana/web3.js';

/**
 * A simple struct that associates a pubkey with a profile photo
 * and display name
 */
export interface Identity {
  publicKey: PublicKey;
  displayName: string;
  profilePicture: URL;
}

export const identities: Identity[] = [
  {
    publicKey: new PublicKey('6rF7ZEs84kAEA3bxcHeFJ2ej4vQxyhc5NrRpTvwkreTp'),
    displayName: 'Verata',
    profilePicture: new URL('https://doc-0s-bs-docs.googleusercontent.com/docs/securesc/e6mripk49ul59fo8thgk8mve2b5oo8p8/06jts9sr2ffaot0h8gigo5n4ad1k7sq5/1662749400000/04105683037536965023/00360557387116705666/15fhKVSSw4ovJfPvbcKj2GBy9kNQRSzm-?e=view&ax=AI9vYm45gyn3nBL6OT0ApaH6eg6u-6tbPRrTABQISjcOhU123cGqy2hWV6mkcgbWXdEqvWBiO2Cbf-aj-MarqqLy8aMJ3KbZBupvsVcnlDWvrp0go_WKVhJ1X-1TGyAXXn6kajjnXWzFKtsWYaKROs9HP45_aOeOUl9vtRW-ITlrOFzFbsKD5wjPX5X2W5SGHeKT0Y2BzrLN9A7H0B3GfJx7APjNzoqK3Z-miPkJIDfYGPJE3LOa4YYo3ybYiDPB79W5EjRq16ck5jgCp_csqUP3bQDxQCPAzvyxsy7-1s_DfC5OcyazPUSjIdtNnozAYYd4eFghcJvQ4E5GIHXsXHRcz0f4BqI6G05_QXuP5yEGx0aZ-O0NYXL3-ZQn9uOwekBDtNOdEVMbjzmhKJu6Vw4uiIU4WSDpJZcH2O0ZagpSNLaC-eNgHfIBFViymarhQKFAzwNnJTaGFV190sJ9j7fOn46wi25M3PsfxMzuAD6BTwORcNX0b5ly5FYh-riFOaFLNn0MlO1hu-slI2maKzeVN9HI9IhI5OuhdUxbDjmo3AZe6R9EX_UTplPLGfz15oVa6xuu8RC0BixB3yGkV_C-yBVB7CvPIHGk4ndDPuEUwAD5vFCGfvXi69nIqhRX3JFJ9pNcMFO4mhc8CKHi8NmQeZQXH9OZFZCpSB3IARTvOwMbkB2871PiMv1kvvTF-QVcmFpSnp5vv_Ilpw&uuid=efdcadda-453d-42c3-bb30-eb2d0c9eebc9&authuser=0')
  },
  {
    publicKey: new PublicKey('85iDLGzsPBsXn7ao83WtRFsQLfqi8LYhYk3xu2uwo9qD'),
    displayName: 'andrew | dispatch',
    profilePicture: new URL('https://doc-0g-90-docs.googleusercontent.com/docs/securesc/e6mripk49ul59fo8thgk8mve2b5oo8p8/audno9u1268466qmmtqiasg1pvfntm0q/1662750975000/06445599987841717899/00360557387116705666/1orI1cOnwELjSWSUHpBi5KKEcSjUZ7eN8?e=view&ax=AI9vYm4F2OdgFyxqh8MJ2zt898GF1KoE5ueqbY7f-s74I10FeWEISHh_VWvoAjVYEDiUrGV71d2VshUm_L7B4HdrVzrUfE7AX8tDqp54uGJidi-5HvkvXtJ-zr3hBejaP7_Oscnd59OwT-qDtI4_m1tgA8cie1sYMHSzLewd9SSsWLj2SEl_fQ7hK-ZzuzSk-KMXfc2V6OTym7A0VJqbs7fx3N1u9v9VuYvXcLK5g0vEAQA_DB9f1Kq9DsxhutZrHuEN9pv1aOwRRV1D8en-kIvb2u3RwH1fp5vzuN6m8v5scNeVEj_cIOivnyh_5lxGL3AD_f_4ecvvKLdRYb_1yaP27Xbw9kAzboAnvASNBPGSAwxjoigQJOVw3lthhK5ZT_k5MKtS3SxL9JC1ceV7UkQ_1m0OecIxkXsBqJHlrZ2Pry6nvoDfbgGPB0whk9bjU-8q9NJkkkLllbTjQMRdjyNlSE3-4yTNDvRuhAgFgHwYnteJ2d7oizj_MSiziHQ0htALcHkwE0MRRHbJqxLzLLyaufCBDJ8kSRRzGcrSR2whPtIF8klcfDSvjitM-h49zoGvpiKst8pRORgYTcY01Wy1JNytE2HMybqOEWr_lI0y_8Q9gmDv3Lm5q1lLuoVE3Tx8ujqmIwRQxxaCr8G2SFWUBy6HuwYWIcpuFLE0BfOMAQ2shVw0husrbIqKb3PaLqxGPgIbotcbFJ6u-w&uuid=be52b6b3-1253-46cb-b48e-4613c2a5648d&authuser=0')
  }
];

export function getIdentity(
  publicKey: PublicKey
): Identity | null {
  return identities.find(id =>
    id.publicKey.equals(publicKey)
  ) || null;
}
