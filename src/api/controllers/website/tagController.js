const catchAsync = require("./../../../utils/error/catchAsync");
const APIFeature = require("./../../../utils/apiFeatures");

// Load Model
const Tag = require("./../../../models/website/tagModel");

// Create New Tag
const createTag = catchAsync(async (req, res) => {
	const newTag = await Tag.create(req.body);
	res.status(201).json({
		status: "success",
		data: newTag,
	});
});

// get All tags
const getAllTag = catchAsync(async (req, res) => {
	const feature = new APIFeature(Tag.find(), req.query)
		.filter()
		.sort()
		.limitFields()
		.paginate();
	const tagList = await feature.query;

	// get count
	const cQuery = new APIFeature(Tag.countDocuments(), req.query).countFilter();
	const docCount = await cQuery.query;

	Promise.all([tagList, docCount]).then(() => {
		res.status(200).json({
			status: "success",
			result: docCount,
			data: tagList,
		});
	});
});

// get a specific tag details
const getTag = catchAsync(async (req, res) => {
	const tag = await Tag.findOne({ _id: req.params.id });

	res.status(200).json({
		status: "success",
		data: tag,
	});
});

// update Tag
const updateTag = catchAsync(async (req, res) => {
	const updatedTag = await Tag.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
	});
	res.status(200).json({ status: "Success", data: updatedTag });
});

// delete a specific tag
const deleteTag = catchAsync(async (req, res) => {
	await Tag.deleteOne({ _id: req.params.id });
	res.status(200).json({
		status: "Success",
		message: "Tag deleted Successfully",
	});
});

module.exports = { createTag, getAllTag, getTag, updateTag, deleteTag };
