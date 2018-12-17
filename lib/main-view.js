'use babel';

export default class MainView {

  constructor(serializedState) {
  }

  serialize() {}

  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

}
