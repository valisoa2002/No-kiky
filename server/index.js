'use strict';

const express = require('express');
const multer = require('multer');
const { createWorker, PSM } = require('tesseract.js');
const { extractCandidates } = require('./codes');

const app = express();
const PORT = Number(process.env.PORT || 3001);
app.disable('x-powered-by');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('Format image invalide : JPEG, PNG ou WebP.'), ok);
  },
});

let workerPromise = null;
let ready = false;
let busy = false;

function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      // Le modele anglais Tesseract est telecharge lors de la premiere utilisation.
      // Aucun numero ni image n'est envoye a Tesseract par un service cloud.
      const worker = await createWorker('eng');
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789 -',
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      });
      ready = true;
      console.log('OCR initialise. Serveur pret.');
      return worker;
    })().catch((error) => {
      workerPromise = null;
      ready = false;
      throw error;
    });
  }
  return workerPromise;
}

app.get('/health', (_req, res) => res.json({
  status: ready ? 'ready' : 'loading',
  service: 'no-kiky-ocr',
}));

app.post('/api/ocr', upload.single('image'), async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ error: 'Envoyez une photo dans le champ image.' });
  }
  if (busy) {
    return res.status(429).json({ error: 'OCR occupe. Reessayez dans quelques secondes.' });
  }
  busy = true;
  try {
    const worker = await getWorker();
    const { data } = await worker.recognize(req.file.buffer);
    const codes = extractCandidates(data?.text || '');

    // Ne jamais logger, stocker, ni renvoyer l'image ou le texte OCR brut.
    return res.json({ codes });
  } catch (error) {
    // Ne pas exposer les traces internes ni le contenu de la carte.
    console.error('Echec du traitement OCR:', error?.name || 'Error');
    return res.status(503).json({ error: 'OCR indisponible. Verifiez que le modele Tesseract est telecharge et reessayez.' });
  } finally {
    busy = false;
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Photo trop volumineuse (5 Mo maximum).' });
  }
  return res.status(400).json({ error: error?.message || 'Requete invalide.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API OCR No-kiky sur http://0.0.0.0:${PORT}`);
  console.log(`Ouvrez http://IP_DE_VOTRE_PC:${PORT}/health depuis le telephone.`);
  // Initialiser maintenant pour eviter le long delai au premier scan.
  getWorker().catch((error) => console.error('Modele OCR indisponible:', error?.name || 'Error'));
});
