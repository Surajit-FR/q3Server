import express, { Request, Response } from 'express';
import fs from "fs";
import { uploadOnCloudinary } from '../../utils/cloudinary';
import { upload } from '../middlewares/multer.middleware';
const router = express.Router();


// Upload Image Endpoint

router.post('/upload-to-cloudinary', upload.single('image'), async (req: Request, res: Response) => {
    try {    
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No file uploaded or invalid file type.' });
            return
        }

        const localFilePath = req.file && req.file.path;

        // Upload the file to Cloudinary
        const uploadResponse = await uploadOnCloudinary(localFilePath);

        if (!uploadResponse) {
            res.status(500).json({ success: false, message: 'Failed to upload image to Cloudinary.' });
            return
        }

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully.',
            data: {
                url: uploadResponse.secure_url,
                public_id: uploadResponse.public_id,
            },
        });
    } catch (error: any) {


    }4
});

export default router;