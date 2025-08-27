const Product = require("../models/Product");
const Brand = require("../models/Brand");
const Category = require("../models/Category");
const ApiError = require("../errors/api-error");

// addAllProducts
module.exports.addProduct = async (req, res, next) => {
  try {
    const imageURLs = [req.body.image, ...req.body.relatedImages];
    const newProduct = new Product({
      ...req.body,
      relatedImages: imageURLs,
    });
    await newProduct.save();
    const { _id: productId, brand, category } = newProduct;
    //update Brand
    await Brand.updateOne(
      { _id: brand.id },
      { $push: { products: productId } }
    );
    //Category update
    await Category.updateOne(
      { _id: category.id },
      { $push: { products: productId } }
    );

    res.send({
      message: "Product added successfully",
    });
  } catch (err) {
    next(err);
  }
};
// addAllProducts
module.exports.addAllProducts = async (req, res) => {
  try {
    await Product.deleteMany();
    const result = await Product.insertMany(req.body);
    res.send({
      message: "Products added successfully",
      result,
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

// get all show products
module.exports.getShowingProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const [products, totalItems] = await Promise.all([
      Product.find({ status: "active" }).skip(skip).limit(limit),
      Product.countDocuments()
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    // const result = await Product.find({ status: "active" })

    res.json({
      success: true,
      products: products,
      meta: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems
      }
    });
  } catch (error) {
    next(error);
  }
};

// get all products
module.exports.getAllProducts = async (req, res, next) => {
  try {
    const {success, result, meta} =  await paginateProducts(req.query.page, req.query.limit, {});

    // const page = parseInt(req.query.page) || 1;
    // const limit = parseInt(req.query.limit) || 10;

    // const skip = (page - 1) * limit;

    // const [products, totalItems] = await Promise.all([
    //   Product.find().skip(skip).limit(limit),
    //   Product.countDocuments()
    // ]);

    // const totalPages = Math.ceil(totalItems / limit);

    //const result = await Product.find({});

    res.status(200).json({
      success: success,
      data: result,
      meta: meta,
      // meta: {
      //   currentPage: page,
      //   totalPages: totalPages,
      //   totalItems: totalItems
      // }
    });
  } catch (error) {
    next(error);
  }
};

// getDiscountProduct
module.exports.getDiscountProduct = async (req, res, next) => {
  try {
    const discountProducts = await Product.find({ discount: { $gt: 0 } });
    res.json({
      success: true,
      products: discountProducts,
    });
  } catch (err) {
    next(err);
  }
};

// getDiscountProduct
module.exports.getSingleProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id });
    res.json(product);
  } catch (err) {
    next(err);
  }
};

// get related products
module.exports.getRelatedProducts = async (req, res, next) => {
  const { tags } = req.query;
  const queryTags = tags?.split(",");
  try {
    const product = await Product.find({ tags: { $in: queryTags } }).limit(4);
    res.status(200).json({
      status: true,
      product,
    });
  } catch (err) {
    next(err);
  }
};

// update product
exports.deleteProduct = async (req, res, next) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({
      message: "Product delete successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const isExist = await Product.findOne({ _id: req.params.id });

    if (!isExist) {
      throw new ApiError(404, "Product not found !");
    }

    const result = await Product.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      {
        new: true,
      }
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


async function paginateProducts(
  inPage, inLimit, inPredicat
) {
  try {
    const page = parseInt(inPage) || 1;
    const limit = parseInt(inLimit) || 10;

    const skip = (page - 1) * limit;

    const [products, totalItems] = await Promise.all([
      Product.find(inPredicat).skip(skip).limit(limit),
      Product.countDocuments()
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      success: true,
      result: products,
      meta: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems
      }
    }
  } catch (err) {
    console.log(`ERROR: ${err.message}`)
    throw err;
  }
}