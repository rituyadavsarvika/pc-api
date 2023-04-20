const fs = require('fs');
const generateUniqueId = require('generate-unique-id');
const KEYS = require('./../../../../config/keys');
const DIR = KEYS.MEDIA_ROOT;

// Load Model
const MediaContent = require('./../../../models/media/mediaContentModel');

const useTemplate = (req, res, next) => {
    const { files, franchiseeId, adminType } = req.body;
    if (adminType === 'CA') {
        const franchiseeCode = req.code;
        const code = KEYS?.CODE;
        let pathObj = {};

        // generate 8 digit unique code
        const uId = generateUniqueId({
            length: 8,
            useLetters: true,
            useNumbers: true
        });

        for (const mediaList in files) {
            const mList = files[mediaList];

            // check if imageList not empty
            if (mList && mList.length > 0) {
                mList.map(url => {
                    const fileSplit = url.split('/');
                    const mediaType = fileSplit[1];
                    const file = fileSplit.pop(); //file: '2.png'
                    const fileNameSplit = file.split('.');
                    const extension = fileNameSplit.pop();
                    const fileName = fileNameSplit.pop(); //file.split('/').pop();
                    // "6ww1y6ej/image/background-46268796.png"

                    // generate media directory
                    let newUrl = `${DIR}/${franchiseeCode}/${mediaType}`;
                    // /home/sharif/media/8e1wwfw7/image
                    // create media Directory if not exists
                    if (!fs.existsSync(newUrl)) {
                        fs.mkdirSync(newUrl, { recursive: true });
                    }

                    let filePath;
                    if (fileSplit[0] === 'undefined') {
                        filePath = url
                            .toString()
                            .replace(
                                new RegExp('undefined', 'g'),
                                franchiseeCode
                            );
                    } else {
                        filePath = url
                            .toString()
                            .replace(new RegExp(code, 'g'), franchiseeCode);
                    }

                    // "8e1wwfw7/image/background-46268796.png"

                    let newMediaUrl = filePath;
                    let newMediaFullUrl = `${DIR}/${newMediaUrl}`;
                    // "/home/sharif/media/8e1wwfw7/image/background-46268796.png"

                    if (fs.existsSync(newMediaFullUrl)) {
                        newMedia = filePath.split('.');
                        newMedia.pop();
                        newMedia = `${newMedia.join('.')}-${uId}.${extension}`;
                        newMediaUrl = newMedia;
                        newMediaFullUrl = `${DIR}/${newMediaUrl}`;
                    }

                    // File destination.txt will be created or overwritten by default.
                    fs.copyFile(`${DIR}/${url}`, newMediaFullUrl, err => {
                        // TODO: Have to set altText, caption & description form original media content
                        if (err) console.error(err);
                        else {
                            MediaContent.create({
                                fileName: `${fileName}-${uId}`,
                                adminType: 'CA',
                                franchiseeId,
                                filePath: newMediaUrl,
                                mediaType,
                                contentType: `${mediaType}/${extension}`,
                                altText: `${fileName}-${uId}`,
                                caption: `${fileName}-${uId}`,
                                description: `${fileName}-${uId}`
                            });
                        }
                    });

                    pathObj[url] = newMediaUrl;
                });
            }
        }

        req.replaceObject = pathObj;
        next();
    } else
        return res.status(200).json({
            status: 'success',
            content: req.body.content
        });
};

module.exports = { useTemplate };
