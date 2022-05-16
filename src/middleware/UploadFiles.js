const AsyncHandler = require('../utils/AsyncHandler');
const ErrorHandler = require('../utils/Errorhandler');
const sharp = require('sharp');
const multer = require('multer');
const response = require('../utils/response');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true)
    } else {
        cb(new ErrorHandler('Please upload only images', 200, 'e400'))
    }
}

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

//Filter Files
exports.validateImage = upload.fields([{ name: 'cover_image', maxCount: 1 },{name: 'logo', maxCount: 1}, { name: 'images', maxCount: 10 }]);

exports.uploadSingle = upload.single('photo');

//Upload
exports.uploadImages = AsyncHandler(async (req, res, next) => {
    //check if images were uplaoded
    if (!req.files.cover_image && !req.files.images) return next(new ErrorHandler('Please make sure you upload cover image and showcase image', 200, 'e404'));
    // console.log(req.files);

    //Set cover image file name
    req.body.cover_image = `public/images/${req.body.name.split(' ').join('_').toUpperCase()}-${Date.now()}-cover.jpeg`;

    await sharp(req.files.cover_image[0].buffer).toFormat('jpeg').jpeg({ quality: 90 }).toFile(`${req.body.cover_image}`);

    req.body.images = []; 
    await Promise.all(
        req.files.images.map(async (file, i) => {
            const filename = `public/images/img-${req.body.name.split(' ').join('_').toUpperCase()}-${Date.now()}-${i + 1}.jpeg`;


            await sharp(file.buffer).toFormat('jpeg').jpeg({quality: 90}).toFile(`${filename}`);

            req.body.images.push(filename);
        })
    )

    next();
})

//Upload business logo
exports.uploadBussinessLogo = AsyncHandler(async (req, res, next) => {
    //check if logo exists
    // console.log(req.files);
    if(!req.files.logo) return next();

    //Set cover image file name
    req.body.logo =  `public/vendors/vendor-${req.body.business_name.split(' ').join('_')}-logo.jpeg`;

    await sharp(req.files.logo[0].buffer).toFormat('jpeg').jpeg({quality: 90}).toFile(`${req.body.logo}`);

    next();
});


