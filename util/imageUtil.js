import multer from "multer"
import path from "path"

const tempStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./database/uploads")
    },
    filename: function (req, file, cb) {
      const parts = file.originalname.split(".")
      const ext = parts[parts.length - 1]
      req.body.photoString = "groupPhoto." + ext
      cb(null, "groupPhoto." + ext)
    }
  })
  
  export const upload = multer({ storage: tempStorage })