import axios from 'axios';
import { icons } from 'feather-icons';
import { showNotification } from '../modules/showNotification.js';

export default class App {
  constructor(root) {
    // 🚀 Props
    this.root = root;
    this.posts = [];
    this.URL = 'https://63c83f46e52516043f4ee625.mockapi.io/posts';
    // 🚀 Render Skeleton
    this.root.innerHTML = `
      <h3 class='title'>Twitty</h3>
      <div class='content'>

        <form data-form=''>
          <input type='text' name='title' id=''>
          <textarea name='body'></textarea>
          <button type='submit'>Submit</button>
          <input type='text' name='postId' class='visually-hidden'>
        </form>

        <div class='result'>
          <div data-loader='' class='loader'>
            <div class='dot-wave'>
              <div class='dot-wave__dot'></div>
              <div class='dot-wave__dot'></div>
              <div class='dot-wave__dot'></div>
              <div class='dot-wave__dot'></div>
            </div>
          </div>

          <ul class='list hide' data-list=''></ul>
        </div>
      </div>
    `;

    // 🚀 Query Selectors
    this.DOM = {
      form: document.querySelector('[data-form]'),
      list: document.querySelector('[data-list]'),
      loader: document.querySelector('[data-loader]'),
    };

    // 🚀 Events Listeners
    this.fetchData();
    this.DOM.form.addEventListener('submit', this.onSubmit);
    this.DOM.list.addEventListener('click', this.onClick);
  }

  //===============================================
  // 🚀 Methods
  //===============================================
  /**
   * @function onSubmit - Form submit event handler
   * @param event
   */
  onSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const { title, body, postId } = Object.fromEntries(new FormData(form).entries());

    if (title.trim().length === 0 || body.trim().length === 0) {
      showNotification('warning', 'Please fill the fields.');
      return;
    }

    try {
      // Create Post
      if (postId.trim().length === 0) {
        const { status, statusText } = await axios.post(`${this.URL}`, { title, body });

        if (status !== 201 || statusText !== 'Created') {
          showNotification('danger', 'Something went wrong, open developer console.');
          return;
        }

        await this.fetchData();
        showNotification('success', 'Post successfully created.');
      } else {
        // Update Post
        const { status } = await axios.put(`${this.URL}/${postId}`, { title, body });

        if (status !== 200) {
          showNotification('danger', 'Something went wrong, open developer console.');
          return;
        }

        this.posts = this.posts.map(i => i.id === postId ? { ...i, title, body } : i);
        this.renderHTML(this.posts);
        showNotification('success', 'Post successfully updated.');
        this.DOM.form.querySelector('.cancel').remove()
      }
    } catch (e) {
      showNotification('danger', 'Something went wrong, open developer console.');
      console.log(e);
    }

    // Reset form
    form.reset();
  };

  /**
   * @function fetchData - Fetch data from API
   * @return {Promise<void>}
   */
  fetchData = async () => {
    this.DOM.loader.classList.remove('hide');
    try {
      // Get data
      const { data } = await axios.get(`${this.URL}`);
      this.posts = data;
      // Render items
      this.renderHTML(this.posts);
      // Show preloader
      this.DOM.loader.classList.add('hide');
    } catch (e) {
      this.DOM.loader.classList.add('hide');
      this.DOM.list.classList.add('hide');
      showNotification('danger', 'Something went wrong, open developer console.');
      console.log(e);
    }
  };

  /**
   * @function renderHTML - Render items HTML
   * @param data
   */
  renderHTML = (data) => {
    // Clear list
    this.DOM.list.innerHTML = ``;
    this.DOM.list.classList.remove('hide');
    // Render Items
    for (const { title, body, id } of data) {
      const li = document.createElement('li');
      li.innerHTML = `
        <h3 class='h4'>${title}</h3>
        <p>${body}</p>
        <div class='buttons'>
          <button data-edit='${id}'>${icons.edit.toSvg({ color: '#41b6e6' })}</button>
          <button data-delete='${id}'>${icons.x.toSvg({ color: '#ff585d' })}</button>
        </div>`;
      this.DOM.list.append(li);
    }
  };

  /**
   * @function onClick - Posts list click event handler
   * @param target
   * @return {Promise<void>}
   */
  onClick = async ({ target }) => {
    // Delete post
    if (target.matches('[data-delete]') && confirm('Are you sure?')) {
      const postId = target.dataset.delete;
      try {
        const { status, statusText } = await axios.delete(`${this.URL}/${postId}`);

        if (status !== 200 || statusText !== 'OK') {
          showNotification('danger', 'Something went wrong, open developer console.');
          return;
        }

        this.posts = this.posts.filter(i => i.id !== postId);
        this.renderHTML(this.posts);
        showNotification('success', 'Post successfully deleted.');
      } catch (e) {
        showNotification('danger', 'Something went wrong, open developer console.');
        console.log(e);
      }
    }

    // Edit post
    if (target.matches('[data-edit]')) {
      const postId = target.dataset.edit;
      const post = this.posts.find(i => i.id === postId);
      this.DOM.form.title.value = post.title;
      this.DOM.form.title.focus()
      this.DOM.form.body.value = post.body;
      this.DOM.form.postId.value = post.id;
      this.DOM.form.querySelector('button').textContent = 'Update';
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel update';
      cancelBtn.classList.add('cancel');
      cancelBtn.setAttribute('type', 'button');
      this.DOM.form.appendChild(cancelBtn);
      cancelBtn.addEventListener('click', () => {
        this.DOM.form.reset();
        cancelBtn.remove();
        this.DOM.form.querySelector('button').textContent = 'Submit';
      });
    }
  };
}
