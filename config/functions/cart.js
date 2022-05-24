
const cartTotal = (cart) => {
  try {
    const subTotal = cart.reduce(
      (counter, product) => counter + product.price * product.qty,
      0
    );
    return subTotal * 100
  } catch (err) {
    console.log(err);
  }
};

const cartSubTotal = (cart) => {
  try {
    const subTotal = cartTotal(cart);
    const total = subTotal + subTotal * 0.1;
    return Math.round(total);
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  cartTotal,
  cartSubTotal
};
