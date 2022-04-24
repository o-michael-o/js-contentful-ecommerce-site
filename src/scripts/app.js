// initialise Contentful object
const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: "vv2j7ybsnxd2",
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: "b8y3rMTSW0KzH60E4d_WGHGwf378VDyQI-alCrjFSMY",
});
// console.log(client);

//  GLOBAL VARIABLES

// DOM references
const $cartBtn = document.querySelector(".cart-btn");
const $closeCartBtn = document.querySelector(".close-cart");
const $clearCartBtn = document.querySelector(".clear-cart");
const $cart = document.querySelector(".cart");
const $cartOverlay = document.querySelector(".cart-overlay");
const $cartItems = document.querySelector(".cart-items");
const $cartTotal = document.querySelector(".cart-total");
const $cartContent = document.querySelector(".cart-content");
const $productsContainer = document.querySelector(".products-center");

// initialise cart data item
let cart = [];

// create empty array for add to cart buttons
let $addToCartButtons = [];

// retrieve the products from storage
class Products {
  async getProducts() {
    try {
      let contentful = await client.getEntries({
        content_type: "product",
      });
      // console.log(contentful);

      // .then((response) => console.log(response.items))
      // .catch((err) => console.log(err));

      // let result = await fetch("https://jsonplaceholder.typicode.com/posts/1");
      // let result = await fetch("scripts/products.json");
      // console.log(result);
      // let data = await result.json();
      // console.log(data);
      // let products = data.items;
      // console.log(products);

      let products = contentful.items;
      // convert contentful response to simpler JS object
      products = products.map((p) => {
        // destructurer needed properties
        const { title, price } = p.fields;
        const { id } = p.sys;
        const image = p.fields.image.fields.file.url;

        return { title: title, price: price, image: image, id: id };
      });
      return products;
    } catch (error) {
      console.log(error);
    }
  }
}

// display the products to UI
class UI {
  displayProducts(products) {
    // console.log(products);
    let result = "";
    products.forEach((p) => {
      result += `
        <article class="product">
          <div class="img-container">
            <img src=${p.image} alt="" class="product-img" />
            <button class="bag-btn" data-id=${p.id}>
              <i class="fas fa-shopping-cart"></i>
              add to cart
            </button>
          </div>
          <h3>${p.title}</h3>
          <h4>${p.price}</h4>
        </article>
      `;
    });
    $productsContainer.innerHTML = result;
  }

  getAddToCartButtons() {
    // const buttons = [...document.querySelectorAll(".bag-btn")];
    // console.log(buttons);
    $addToCartButtons = [...document.querySelectorAll(".bag-btn")];
    $addToCartButtons.forEach((button) => {
      let id = button.dataset.id;
      // console.log(id);
      let inCart = cart.find((item) => item.id === id);
      if (inCart) {
        button.innerText = "In Cart";
        button.disabled = true;
      }
      button.addEventListener("click", (evt) => {
        // console.log(evt);
        // change the text in the button
        evt.target.innerText = "In Cart";
        // disable the button
        evt.target.disabled = true;
        // get product data from local storage for the button, add a qty property
        let newCartItem = { ...LocalStorage.getProduct(id), quantity: 1 };
        console.log(newCartItem);

        // add the product to the cart
        cart = [...cart, newCartItem];
        // console.log(cart);

        // save the cart to local storage
        LocalStorage.saveCart(cart);

        // set cart icon values
        this.setCartValues(cart);

        // display cart item
        this.addCartItem(newCartItem);

        // show cart and display overlay
        // this.showCart();
      });
    });
  }

  setCartValues(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;

    cart.map((product) => {
      tempTotal += product.price * product.quantity;
      itemsTotal += product.quantity;
    });

    // add to DOM
    $cartTotal.textContent = parseFloat(tempTotal.toFixed(2));
    $cartItems.textContent = itemsTotal;

    // console.log($cartTotal);
    // console.log($cartItems);
  }

  addCartItem(newCartItem) {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
      <img src=${newCartItem.image} alt="product" />
      <div>
        <h4>${newCartItem.title}</h4>
        <h5>$${newCartItem.price}</h5>
        <span class="remove-item" data-id=${newCartItem.id}>Remove</span>
      </div>
      <div>
        <i class="fas fa-chevron-up" data-id=${newCartItem.id}></i>
        <p class="item-amount">${newCartItem.quantity}</p>
        <i class="fas fa-chevron-down" data-id=${newCartItem.id}></i>
      </div>
    `;

    $cartContent.appendChild(div);
    // console.log($cartContent);
  }

  showCart() {
    // console.log("showCart");
    $cartOverlay.classList.add("transparentBcg");
    // console.log($cart);
    $cart.classList.add("showCart");
  }

  closeCart() {
    // console.log("showCart");
    $cartOverlay.classList.remove("transparentBcg");
    // console.log($cart);
    $cart.classList.remove("showCart");
  }

  populateCart(cart) {
    cart.forEach((item) => {
      this.addCartItem(item);
    });
  }

  clearCart() {
    console.log(this);
    let cartItems = cart.map((product) => product.id);
    console.log(cartItems);

    // remove from cart
    cartItems.forEach((productId) => {
      this.removeProduct(productId);
    });

    console.log($cartContent.children);

    while ($cartContent.children.length > 0) {
      $cartContent.removeChild($cartContent.children[0]);
    }
    setTimeout(() => {
      this.closeCart();
    }, 1500);
  }

  removeProduct(productId) {
    cart = cart.filter((product) => product.id !== productId);
    this.setCartValues(cart);
    LocalStorage.saveCart(cart);
    let button = this.getSingleButton(productId);
    button.disabled = false;
    button.innerHTML = `<i class="fas fa-shopping-cart"></i>add to cart`;
  }

  getSingleButton(productId) {
    return $addToCartButtons.find((button) => button.dataset.id === productId);
  }

  setupCart() {
    // event listener for clear cart button
    $clearCartBtn.addEventListener("click", () => {
      this.clearCart();
    });

    $cartContent.addEventListener("click", (evt) => {
      // check if event target has the relevant class for removal
      if (evt.target.classList.contains("remove-item")) {
        let $itemToRemove = evt.target;
        let itemToRemoveID = $itemToRemove.dataset.id;
        this.removeProduct(itemToRemoveID);
        // remove from DOM
        // console.log(itemToRemove.parentElement.parentElement);
        $cartContent.removeChild(itemToRemove.parentElement.parentElement);
      } else if (evt.target.classList.contains("fa-chevron-up")) {
        let $increaseQty = evt.target;
        let increaseQtyID = $increaseQty.dataset.id;
        // console.log(increaseQtyID);
        let tempProduct = cart.find((product) => product.id === increaseQtyID);
        tempProduct.quantity = tempProduct.quantity + 1;
        // save to local storage and to cart
        LocalStorage.saveCart(cart);
        this.setCartValues(cart);
        // change in DOM
        $increaseQty.nextElementSibling.textContent = tempProduct.quantity;
      } else if (evt.target.classList.contains("fa-chevron-down")) {
        let $decreaseQty = evt.target;
        let decreaseQtyID = $decreaseQty.dataset.id;
        let tempProduct = cart.find((product) => product.id === decreaseQtyID);
        tempProduct.quantity = tempProduct.quantity - 1;
        if (tempProduct.quantity > 0) {
          LocalStorage.saveCart(cart);
          this.setCartValues(cart);
          // change in DOM
          $decreaseQty.previousElementSibling.textContent =
            tempProduct.quantity;
        } else {
          $cartContent.removeChild($decreaseQty.parentElement.parentElement);
          this.removeProduct(decreaseQtyID);
        }
      }
    });
  }

  startApp() {
    // assign values from local storage to cart array
    cart = LocalStorage.getCart();

    // add to cart
    this.setCartValues(cart);
    this.populateCart(cart);

    // add event listeners
    $cartBtn.addEventListener("click", this.showCart);
    $closeCartBtn.addEventListener("click", this.closeCart);
  }
}

// store in local storage
class LocalStorage {
  static saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products));
  }

  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem("products"));
    // console.log(products);
    return products.find((product) => product.id === id);
  }

  static saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  static getCart() {
    return localStorage.getItem("cart")
      ? JSON.parse(localStorage.getItem("cart"))
      : [];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // instantiate classes
  const ui = new UI();
  const products = new Products();

  ui.startApp();

  // get all of the products
  products
    .getProducts()
    .then((products) => {
      ui.displayProducts(products);
      // use LocalStorage static method to store products to local storage
      LocalStorage.saveProducts(products);
    })
    .then(() => {
      ui.getAddToCartButtons();
      ui.setupCart();
    });
});
