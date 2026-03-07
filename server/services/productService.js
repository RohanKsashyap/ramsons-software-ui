const { Product } = require('../database/models');
const { Op } = require('sequelize');

class ProductService {
  async getAllProducts() {
    try {
      return await Product.findAll({
        order: [['name', 'ASC']],
      });
    } catch (error) {
      throw new Error(`Error fetching products: ${error.message}`);
    }
  }

  async getProductById(id) {
    try {
      const product = await Product.findByPk(id);
      if (!product) {
        throw new Error('Product not found');
      }
      return product;
    } catch (error) {
      throw new Error(`Error fetching product: ${error.message}`);
    }
  }

  async createProduct(productData) {
    try {
      return await Product.create(productData);
    } catch (error) {
      throw new Error(`Error creating product: ${error.message}`);
    }
  }

  async updateProduct(id, productData) {
    try {
      const product = await Product.findByPk(id);
      if (!product) {
        throw new Error('Product not found');
      }
      return await product.update(productData);
    } catch (error) {
      throw new Error(`Error updating product: ${error.message}`);
    }
  }

  async deleteProduct(id) {
    try {
      const product = await Product.findByPk(id);
      if (!product) {
        throw new Error('Product not found');
      }
      await product.destroy();
      return { success: true };
    } catch (error) {
      throw new Error(`Error deleting product: ${error.message}`);
    }
  }

  async deleteMultipleProducts(ids) {
    try {
      const deletedCount = await Product.destroy({
        where: {
          id: {
            [Op.in]: ids,
          },
        },
      });
      return {
        success: true,
        deletedCount,
        message: `${deletedCount} products deleted successfully`,
      };
    } catch (error) {
      throw new Error(`Error deleting products: ${error.message}`);
    }
  }
}

module.exports = new ProductService();