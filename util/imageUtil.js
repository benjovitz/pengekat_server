import multer from 'multer';

const tempStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, './database/uploads');
  },
  filename(req, file, cb) {
    const parts = file.originalname.split('.');
    const ext = parts[parts.length - 1];
    req.body.photoString = `groupPhoto.${ext}`;
    cb(null, `groupPhoto.${ext}`);
  },
});

export const upload = multer({ storage: tempStorage });
