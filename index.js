const { createApp } = Vue;

const apiUrl = 'https://vue3-course-api.hexschool.io/';
const apiPath = 'hungya-vue';

// VeeValid
const { Form, Field, ErrorMessage, defineRule, configure} = VeeValidate;
const { required, email, min, max } = VeeValidateRules;
const { localize, loadLocaleFromURL } = VeeValidateI18n;

defineRule('required', required);
defineRule('email', email);
defineRule('min', min);
defineRule('max', max);
loadLocaleFromURL('./zh_TW.json');

configure({
  generateMessage: localize('zh_TW'),
  validateOnInput: true, // 調整為：輸入文字時，就立即進行驗證
});


const productModal = {
  //當id有變動時，取得遠端資料，並呈現 Modal
  props: ['id', 'addToCart', 'openModal'],
  data() {
    return {
      modal: {}, //modal實體化賦予結果的接收
      tempProduct: {},
      qty: 1
    };
  },
  template: '#userProductModal',
  methods: {
    hide() {
      this.modal.hide();
    }
  },
  watch: { //監聽id是否有變動
    id() {
      console.log('id變成', this.id);
      if(this.id){ //如果有 id 
        // 取得單一產品細節
        axios.get(`${apiUrl}v2/api/${apiPath}/product/${this.id}`)
          .then(res => {
            this.tempProduct = res.data.product;
            this.modal.show();
          })
      }
    }
  },
  mounted() {
    //將modal直接做生成
    this.modal = new bootstrap.Modal(this.$refs.modal);
    //監聽DOM，當Modal關閉時...要做其他事情
    this.$refs.modal.addEventListener('hidden.bs.modal', (event) => {
      // console.log('Modal 被關閉哦');
      this.openModal(''); //透過外層傳進來的事件將 id 的值清空
    });
  }
}

const app = createApp({
  data() {
    return {
      products: [],
      productId: '',
      cart: {},
      form: {
        user: {
          email: '',
          name: '',
          tel: '',
          address:'',
        },
        message: ''
      },
      loadingItem: '', // 存id,目的是為了讓項目做一次操作完成(而非短時間重複點擊，在後端尚未回應前一值去戳後端)
    };
  },
  methods: {
    // 取得產品列表
    getProducts() {
      axios.get(`${apiUrl}v2/api/${apiPath}/products/all`)
        .then(res => {
          this.products = res.data.products;
        })
    },
    openModal(id) {
      this.loadingItem = id;
      this.productId = id;
    },
    // 將產品加入購物車
    addToCart(product_id, qty = 1) { //qty = 1 -> 參數預設值, 當沒有傳入參數時，會使用預設值
      this.loadingItem = product_id;
      const data = {
        product_id,
        qty
      };
      console.log('data', data);
      axios.post(`${apiUrl}v2/api/${apiPath}/cart`, { data })
        .then(res => {
          this.$refs.productModal.hide();
          this.getCart();
          alert(res.data.message);
          this.loadingItem = '';
        })
        .catch((err) => {
          alert(err.data.message);
        });
    },
    // 取得購物車列表
    getCart() {
      axios.get(`${apiUrl}v2/api/${apiPath}/cart`)
        .then(res => {
          this.cart = res.data.data;
        })
        .catch((err) => {
          alert(err.data.message);
        });
    },
    // 調整購物車品項數量
    updataCartItem(item) {
      const data = {
        product_id: item.product.id,
        qty: item.qty
      }
      this.loadingItem = item.id;
      axios.put(`${apiUrl}v2/api/${apiPath}/cart/${item.id}`, { data })
        .then(res => {
          this.getCart();
          this.loadingItem = ''; //清空
        })
        .catch((err) => {
          alert(err.data.message);
        });
    },
    // 刪除購物車單筆項目
    deleteCartItem(item) {
      this.loadingItem = item.id;
      axios.delete(`${apiUrl}v2/api/${apiPath}/cart/${item.id}`)
        .then(res => {
          this.getCart();
          this.loadingItem = '';
          alert(res.data.message);
        })
        .catch((err) => {
          alert(err.data.message);
        });
    },
    // 清空購物車
    deleteAllCartItems(){
      axios.delete(`${apiUrl}v2/api/${apiPath}/carts`)
      .then(res => {
        this.getCart();
        alert(res.data.message);
        this.loadingItem = '';
      })
      .catch((err) => {
        alert(err.data.message);
      });
    },
    // 建立訂單，送出訂購人資訊
    createOrder() { 
      const data = {
        "user": this.form.user,
        "message": this.form.message
      }
      axios.post(`${apiUrl}v2/api/${apiPath}/order`, { data })
      .then(res => {
        alert(res.data.message);
        this.$refs.form.resetForm(); //清空表格
        this.message = ''; //清空message欄位
        this.getCart();
      })
      .catch((err) => {
        alert(err.data.message);
      });
    }
  },
  components: {
    VForm: Form,
    VField: Field,
    ErrorMessage: ErrorMessage,
  },
  mounted() {
    this.getProducts();
    this.getCart();
  }
});
app.component('productModal', productModal);
app.use(VueLoading.LoadingPlugin);
app.mount('#app');