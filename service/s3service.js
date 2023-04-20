const AWS = require('aws-sdk');
const bluebird = require('bluebird');
const multer = require('multer');
const multerS3 = require('multer-s3');
const catchAsync = require('../src/utils/error/catchAsync');
const config = require('../config/keys');

const BUCKET = config.BUCKET_NAME;

// configure the keys for accessing AWS
AWS.config.update({
	accessKeyId: config.ACCESS_KEY_ID,
	secretAccessKey: config.SECRET_KEY_ACCESS
});

// configure AWS to work with promises
AWS.config.setPromisesDependency(bluebird);

// Create new s3 instance
const s3 = new AWS.S3();

// upload an image
const upload = multer({
	storage: multerS3({
		s3: s3,
		bucket: BUCKET,
		fileFilter: (req, file, cb) => {
			if (
				file.mimetype == 'image/png' ||
				file.mimetype == 'image/jpg' ||
				file.mimetype == 'image/jpeg'
			) {
				cb(null, true);
			} else {
				cb(null, false);
				return cb(
					new Error('Only .png, .jpg and .jpeg format allowed!')
				);
			}
		},
		metadata: function (req, file, cb) {
			cb(null, { fieldName: file.fieldname });
		},
		key: function (req, file, cb) {
			cb(null, file.originalname);
		}
	})
});

// abstracts function to upload a file returning a promise
const uploadFile = (buffer, name, type) => {
	const params = {
		ACL: 'public-read',
		Body: buffer,
		Bucket: BUCKET,
		ContentType: type.mime,
		Key: `${config.IMAGE_DIRECTORY}/${name}.${type.ext}`
	};
	return s3.upload(params).promise();
};

// delete previously uploaded file from s3 bucket
const deleteFile = catchAsync(async imageUrl => {
	// check previously uploaded image
	if (imageUrl) {
		// get only image name with bucket name like --> bucketName/imageName.extension
		imageFileName = imageUrl.split('.com/')[1];
		if (imageFileName) {
			var params = {
				Bucket: BUCKET,
				Key: imageFileName
			};

			// if linked image is exist in s3 bucket or not
			s3.headObject(params, function (err, metadata) {
				if (err && err.code === 'NotFound') {
					console.log('Nothing to delete! ');
				} else {
					// if exist then delete that file
					s3.deleteObject(params, (err, data) => {
						if (data) {
							console.log(
								` ******** Image "${imageFileName}" deleted successfully *********`
							);
						} else {
							console.log(
								`********* Check if you have sufficient permissions : ${err.name} ${err.message} ******* `
							);
						}
					});
				}
			});
		}
	}
});

module.exports = { upload, uploadFile, deleteFile };
