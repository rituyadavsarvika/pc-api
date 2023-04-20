const catchAsync = require('../../../../utils/error/catchAsync');
const APIFeature = require('../../../../utils/apiFeatures');
const config = require('../../../../../config/keys');
const Validator = require('../../../../utils/validator');
const FranchiseeModel = require('../../../../models/franchisee/franchiseeModel');
const { domainExistanceHandler, formatBytes } = require('../../../../utils/helper');
const fsPromise = require('fs/promises');
const ip = require('ip');
const dns = require('dns');
const fs = require('fs');
const Page = require('../../../../models/website/pageModel');
const Header = require('../../../../models/website/headerModel');
const Footer = require('../../../../models/website/footerModel');
const Menu = require('../../../../models/website/menuModel');
const SubscriberConfig = require('./../../../../models/config/subscriberConfigModel');
const TourConfig = require('../../../../models/config/tourConfigModel');
const MediaContentModel = require('../../../../models/media/mediaContentModel');
const { Types } = require('mongoose');

// get franchisee by domain
const getActivityOverview = catchAsync(async (req, res, next) => {
    const { id } = req.params
    console.log("getActivityOverview:::", id);

    const franchiseeInfo = await FranchiseeModel
        .findOne({
            $and: [
                { _id: id },
                // { domain: { $eq: domain } }
            ]
        })
        .select('domain domainSlug')


    // Subscriber Query
    const subscriptionQuery = [
        {
            $facet: {
                total: [
                    {
                        $match: {
                            $and: [
                                { franchiseeId: Types.ObjectId(id) },
                                // { status: 'publish' },
                            ]
                        },
                    },
                    { $count: 'count' }
                ],
                topMenu: [
                    {
                        $match: {
                            $and: [
                                { franchiseeId: Types.ObjectId(id) },
                                { topMenu: true },
                            ]
                        },
                    },
                    { $count: 'count' }
                ],
                // primaryMenu: [
                //     {
                //         $match: {
                //             $and: [
                //                 { franchiseeId: Types.ObjectId(id) },
                //                 { primaryMenu: true },
                //             ]
                //         },
                //     },
                //     { $count: 'count' }
                // ],
                // footerMenu: [
                //     {
                //         $match: {
                //             $and: [
                //                 { franchiseeId: Types.ObjectId(id) },
                //                 { footerMenu: true },
                //             ]
                //         },
                //     },
                //     { $count: 'count' }
                // ],
            }
        },
        {
            $project: {
                // pages: {
                total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
                topMenu: { $ifNull: [{ $arrayElemAt: ['$topMenu.count', 0] }, 0] },
                // primaryMenu: { $ifNull: [{ $arrayElemAt: ['$primaryMenu.count', 0] }, 0] },
                // footerMenu: { $ifNull: [{ $arrayElemAt: ['$footerMenu.count', 0] }, 0] },
                // }
            }
        }
    ]

    // Subscriber data
    const subscriptionInfo = await SubscriberConfig
        .findOne({ franchiseeId: Types.ObjectId(id) })
        .populate({
            path: 'subscriptionPlanId',
            select: 'name'
        })
        .select('-__v')
        .lean()

    // Page Query
    const pageQuery = [
        {
            $facet: {
                totalPages: [
                    {
                        $match: {
                            $and: [
                                { franchiseeId: Types.ObjectId(id) },
                                // { status: 'publish' },
                            ]
                        },
                    },
                    { $count: 'count' }
                ],
                publishedPages: [
                    {
                        $match: {
                            $and: [
                                { franchiseeId: Types.ObjectId(id) },
                                { status: 'publish' },
                            ]
                        },
                    },
                    { $count: 'count' }
                ],
                unpublishedPages: [
                    {
                        $match: {
                            $and: [
                                { franchiseeId: Types.ObjectId(id) },
                                { status: 'unpublish' },
                            ]
                        },
                    },
                    { $count: 'count' }
                ],
            }
        },
        {
            $project: {
                // pages: {
                totalPages: { $ifNull: [{ $arrayElemAt: ['$totalPages.count', 0] }, 0] },
                publishedPages: { $ifNull: [{ $arrayElemAt: ['$publishedPages.count', 0] }, 0] },
                unpublishedPages: { $ifNull: [{ $arrayElemAt: ['$unpublishedPages.count', 0] }, 0] },
                // }
            }
        }
    ]

    // Page data
    const pageInfo = await Page.aggregate(pageQuery)

    // Header Query
    const headerQuery = [
        {
            $facet: {
                total: [
                    {
                        $match: {
                            $and: [
                                { franchiseeId: Types.ObjectId(id) },
                                // { status: 'publish' },
                            ]
                        },
                    },
                    { $count: 'count' }
                ],
                active: [
                    {
                        $match: {
                            $and: [
                                { franchiseeId: Types.ObjectId(id) },
                                { active: true },
                            ]
                        },
                    },
                    {
                        $project: {
                            name: 1,
                        }
                    },
                    // { $count: 'count' },
                ],
                inactive: [
                    {
                        $match: {
                            $and: [
                                { franchiseeId: Types.ObjectId(id) },
                                { active: false },
                            ]
                        },
                    },
                    { $count: 'count' }
                ],
            }
        },
        {
            $project: {
                // pages: {
                total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
                active: { $ifNull: [{ $arrayElemAt: ['$active', 0] }, 0] },
                inactive: { $ifNull: [{ $arrayElemAt: ['$inactive.count', 0] }, 0] },
                // }
            }
        }
    ]

    // Header data
    const headerInfo = await Header.aggregate(headerQuery)

    // Footer Query
    const footerQuery = [
        {
            $facet: {
                total: [
                    {
                        $match: {
                            $and: [
                                { franchiseeId: Types.ObjectId(id) },
                                // { status: 'publish' },
                            ]
                        },
                    },
                    { $count: 'count' }
                ],
                active: [
                    {
                        $match: {
                            $and: [
                                { franchiseeId: Types.ObjectId(id) },
                                { active: true },
                            ]
                        },
                    },
                    {
                        $project: {
                            name: 1,
                        }
                    },
                    // { $count: 'count' }
                ],
                inactive: [
                    {
                        $match: {
                            $and: [
                                { franchiseeId: Types.ObjectId(id) },
                                { active: false },
                            ]
                        },
                    },
                    { $count: 'count' }
                ],
            }
        },
        {
            $project: {
                // pages: {
                total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
                active: { $ifNull: [{ $arrayElemAt: ['$active', 0] }, 0] },
                inactive: { $ifNull: [{ $arrayElemAt: ['$inactive.count', 0] }, 0] },
                // }
            }
        }
    ]

    // Footer data
    const footerInfo = await Footer.aggregate(footerQuery)

    // Menu Query
    const menuQuery = [
        {
            $facet: {
                total: [
                    {
                        $match: {
                            $and: [
                                { franchiseeId: Types.ObjectId(id) },
                                // { status: 'publish' },
                            ]
                        },
                    },
                    { $count: 'count' }
                ],
                active: [
                    {
                        $match: {
                            $and: [
                                { franchiseeId: Types.ObjectId(id) },
                            ],
                            $or: [
                                { topMenu: true },
                                { primaryMenu: true },
                                { footerMenu: true },
                            ]
                        },
                    },
                    {
                        $project: {
                            name: 1,
                        }
                    },
                    // { $count: 'count' }
                ],
                topMenu: [
                    {
                        $match: {
                            $and: [
                                { franchiseeId: Types.ObjectId(id) },
                                { topMenu: true },
                            ]
                        },
                    },
                    { $count: 'count' }
                ],
                primaryMenu: [
                    {
                        $match: {
                            $and: [
                                { franchiseeId: Types.ObjectId(id) },
                                { primaryMenu: true },
                            ]
                        },
                    },
                    { $count: 'count' }
                ],
                footerMenu: [
                    {
                        $match: {
                            $and: [
                                { franchiseeId: Types.ObjectId(id) },
                                { footerMenu: true },
                            ]
                        },
                    },
                    { $count: 'count' }
                ],
            }
        },
        {
            $project: {
                // pages: {
                total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
                active: { $ifNull: [{ $arrayElemAt: ['$active', 0] }, 0] },
                topMenu: { $ifNull: [{ $arrayElemAt: ['$topMenu.count', 0] }, 0] },
                primaryMenu: { $ifNull: [{ $arrayElemAt: ['$primaryMenu.count', 0] }, 0] },
                footerMenu: { $ifNull: [{ $arrayElemAt: ['$footerMenu.count', 0] }, 0] },
                // }
            }
        }
    ]

    // Menu data
    const menuInfo = await Menu.aggregate(menuQuery)

    // Media Query
    const mediaQuery = [
        {
            $facet: {
                total: [
                    {
                        $match: {
                            $and: [
                                { franchiseeId: Types.ObjectId(id) },
                                // { status: 'publish' },
                            ]
                        },
                    },
                    { $count: 'count' }
                ],
                images: [
                    {
                        $match: {
                            $and: [
                                { franchiseeId: Types.ObjectId(id) },
                            ],
                            $or: [
                                { contentType: /^image/ },
                                // { contentType: 'image/jpeg' },
                                // { contentType: 'image/webp' },
                            ]
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalSize: { $sum: "$size" },
                            count: { $sum: 1 },
                        }
                    },
                ],
                videos: [
                    {
                        $match: {
                            $and: [
                                { franchiseeId: Types.ObjectId(id) },
                            ],
                            $or: [
                                { contentType: /^video/ },
                                // { contentType: 'video/mp4' },
                                // { contentType: 'image/webp' },
                            ]
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalSize: { $sum: "$size" },
                            count: { $sum: 1 },
                        }
                    },
                ],
                docs: [
                    {
                        $match: {
                            $and: [
                                { franchiseeId: Types.ObjectId(id) },
                            ],
                            $or: [
                                { contentType: /^application\/vnd/ },
                                // { contentType: 'application/pdf' },
                                // { contentType: 'image/webp' },
                            ]
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalSize: { $sum: "$size" },
                            count: { $sum: 1 },
                        }
                    },
                ],
                pdf: [
                    {
                        $match: {
                            $and: [
                                { franchiseeId: Types.ObjectId(id) },
                            ],
                            $or: [
                                { contentType: /^application\/pdf/ },
                            ]
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalSize: { $sum: "$size" },
                            count: { $sum: 1 },
                        }
                    },
                ],
            }
        },
        {
            $project: {
                // pages: {
                total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
                images: { $ifNull: [{ $arrayElemAt: ['$images', 0] }, 0] },
                videos: { $ifNull: [{ $arrayElemAt: ['$videos', 0] }, 0] },
                docs: { $ifNull: [{ $arrayElemAt: ['$docs', 0] }, 0] },
                pdf: { $ifNull: [{ $arrayElemAt: ['$pdf', 0] }, 0] },
                // }
            }
        }
    ]

    // Media data
    const mediaInfo = await MediaContentModel.aggregate(mediaQuery)

    const { total, images, videos, docs, pdf } = mediaInfo && mediaInfo[0]

    const chartLabel = ['images', 'videos', 'docs', 'pdf']
    // const chartData = [{
    //     totalSize: 0.016700,
    //     count: 17,
    //     name: 'images',
    // }]

    const chartData = chartLabel.map(item => {
        return {
            totalSize: Number(formatBytes(mediaInfo && mediaInfo[0]?.[item]?.totalSize)) || 0,
            count: mediaInfo && mediaInfo[0]?.[item]?.count || 0,
            name: item,
        }
    })

    const mediaInfoData = {
        total: total,
        hostingSpace: Number(process.env.FREE_TRAIL_HOSTING_SPACE),
        // chart: [(images?.count || 0), (videos?.count || 0), (docs?.count || 0), (pdf?.count || 0)],
        images: {
            totalSize: formatBytes(images?.totalSize),
            count: images?.count || 0
        },
        videos: {
            totalSize: formatBytes(videos?.totalSize),
            count: videos?.count
        },
        docs: {
            totalSize: formatBytes(docs?.totalSize),
            count: docs?.count
        },
        pdf: {
            totalSize: formatBytes(pdf?.totalSize),
            count: pdf?.count
        },
    }

    res.status(200).json({
        status: 'success',
        data: {
            subscriptionInfo: subscriptionInfo,
            franchiseeInfo: franchiseeInfo,
            pageInfo: pageInfo && pageInfo[0],
            menuInfo: menuInfo && menuInfo[0],
            headerInfo: headerInfo && headerInfo[0],
            footerInfo: footerInfo && footerInfo[0],
            mediaInfoData: {
                ...mediaInfoData,
                chartData
            },
        }
    })

});

// get getTourConfig by Subscriber Id
const getTourConfig = catchAsync(async (req, res, next) => {
    const { id } = req.params
    console.log("getTourConfig:::", id);

    const tourConfigInfo = await TourConfig
        .findOne({
            $and: [
                { franchiseeId: Types.ObjectId(id) },
            ]
        })
        .select('-__v')
        .lean()

    if (!tourConfigInfo)
        return res.status(404).json({
            status: 'falied',
            message: 'Tour config not found',
            data: tourConfigInfo
        });

    res.status(200).json({
        status: 'success',
        data: tourConfigInfo
    })
});

const createTourConfig = catchAsync(async (req, res, next) => {
    const { id } = req.params
    const { adminType, franchiseeId, tours, active } = req.body;
    let condition = undefined;

    if (adminType === 'SA') {
        condition = { adminType: 'SA' };
        req.body.franchiseeId = undefined;
    } else {
        condition = { adminType: 'CA', franchiseeId };
    }

    const tourConfigInfo = await TourConfig.create(req.body);

    if (!tourConfigInfo)
        return res.status(400).json({ status: 'falied', data: tourConfigInfo });

    res.status(201).json({ status: 'success', data: tourConfigInfo });

});

// get updateTourConfig by Subscriber Id
const updateTourConfig = catchAsync(async (req, res, next) => {
    const { id } = req.params
    console.log("getTourConfig:::", id);
    const { adminType, franchiseeId, tours, active } = req.body;
    let condition = undefined;

    if (adminType === 'SA') {
        condition = { adminType: 'SA' };
        req.body.franchiseeId = undefined;
    } else {
        condition = { adminType: 'CA', franchiseeId };
    }

    const tourConfigInfo = await TourConfig
        .updateOne(
            condition,
            {
                $set: {
                    active,
                    tours: tours,
                }
            },
            {
                upsert: true,
                runValidators: true
            }
        )

    // const tourConfigInfo = await TourConfig
    //     .findOneAndUpdate(
    //         {
    //             _id: '612dce352ff6127a9e45e86e',
    //             'tours.tourType': {
    //                 $ne: 'rutulpanchal123@gmail.com'
    //             }
    //         },
    //         {
    //             $push: {
    //                 'tours': {
    //                     currentPage: '/admin',
    //                     status: 'skip'
    //                 }
    //             }
    //         }
    //     );

    if (!tourConfigInfo)
        return res.status(400).json({ status: 'falied', data: tourConfigInfo });

    res.status(202).json({ status: 'success', data: tourConfigInfo });

    // res.status(200).json({
    //     status: 'success',
    //     data: { 
    //         tourConfigInfo,
    //     }
    // })
});

module.exports = {
    getActivityOverview,
    getTourConfig,
    updateTourConfig,
    createTourConfig
};
