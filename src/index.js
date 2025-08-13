const styles = `
input[type="text"] {
    all: unset;
    padding: 12px;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 0.5rem;
    caret-color: rgba(255,255,255,0.5);
    color: white;
}

section#task-container {
    display: flex;
    gap: 6px;
    align-items: center;
}

section#task-container > div {
    display: flex;
    align-items: center;
    gap: 6px;
    color: white;
    font-size: 1rem;
}

section#task-container > button {
    all: unset;
    color: white;
    cursor: pointer;
    background-color: #1f8ed3;
    padding: 12px;
    border-radius: 0.25rem;
}

ul#task-list{
    list-style: none;
    padding: 0;
    width: 60vw;
    display: flex;
    flex-direction: column;
    gap: 6px;
}
li {
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background-color: #434f60;
    color: white;
    border-radius: 0.5rem;
    font-size: 1.25rem;
    /* border-bottom: 1px solid #ddd; */
}

li > div {
    display: flex;
    gap: 12px;
}

li > div > button {
    all: unset;
}

label[for="filter-input"] {
    color: white;
    font-size: 1rem;
}

.cursor-pointer {
    cursor: pointer;
}`

const ICONS = {
    TOGGLE_SELECT: "✅",
    REMOVE: "❌"
}

class Tasks {
    constructor() {
        this.tasks = []
    }

    #getIndexOfTask (task) {
        return this.tasks.indexOf(task)
    }

    #formatTask(task) {
        return task.replaceAll(' ', '').toLowerCase()
    }

    #isDuplicate(value) {
        return this.tasks.some(task => this.#formatTask(task) === this.#formatTask(value))
    }

    addTask(task) {
        if (this.#isDuplicate(task)) throw Error('Cannot create same task.')
        this.tasks.push(task)
    }

    removeTask(task) {
        const taskIndex = this.#getIndexOfTask(task)
        if(taskIndex < 0) {
            return `${task} is not listed in Tasks`
        }
        this.tasks.splice(taskIndex, 1)
    }

    getAllTasks() {
        return this.tasks
    }

    getLastChild() {
        return this.tasks[this.tasks.length - 1]
    }

    filterTasks(val) {
        return this.tasks.filter(task => task.includes(val))
    }

    isNotEmpty() {
        return !!this.tasks.length
    }
}

class InputElement {
    constructor(inputElemId) {
        const elem = document.getElementById(inputElemId)
        if (!elem || elem.tagName !== 'INPUT') {
            throw Error('InputElement can only accept Id from Input Type')
        }
        this.elem = elem
    }

    isNotEmpty() {
        return !!this.elem.value.trim()
    }

    getUserInput() {
        return this.elem.value.trim()
    }

    clearUserInput() {
        this.elem.value = ''
    }

    getElement() {
        return this.elem
    }
}

class ActionButtons {
    classes = ['cursor-pointer']
    constructor(actions, obj){
        this.actions = actions
        this.actionObject = obj
    }

    createButtonElement(innerText, id = null, dataSets = []) {
        const btnElement = document.createElement('button')
        if (id) btnElement.id = id
        if (!!dataSets.length) {
            dataSets.forEach(attrs => {
                const [attr, value] = attrs
                btnElement.dataSet[attr] = value
            })
        }
        btnElement.classList.add(...this.classes)
        btnElement.innerText = innerText
        return btnElement
    }
    getButtonActionElements() {
        const grpElement = document.createElement('div')
        this.actions.forEach(action => {
            grpElement.appendChild(this.createButtonElement(this.actionObject[action]))
        })

        return grpElement
    }
}

class MyCustomElement extends HTMLElement {
    #tasks = new Tasks()
    #inputEvent; #ulEvent; #btnEvent;
        constructor() {
            super();
            // Optional: Attach a Shadow DOM for encapsulation
            this.attachShadow({ mode: 'open' }); 
            this.inputElement = document.createElement('input')
            this.addBtnElement = document.createElement('button')
            this.inputCheckBoxElement = document.createElement('input')
            this.ulElement = document.createElement('ul')
        }

        connectedCallback() {
            // Code to run when the element is added to the DOM
            this.shadowRoot.innerHTML = `<style>
                                            ${styles}
                                        </style>
                                        `
            this.#renderMainContent()
            this.#initiateEvents()

        }

        #createTaskElement(content) {
            const liEl = document.createElement('li')
            const actionBtnFragments = new ActionButtons(Object.keys(ICONS), ICONS)
            liEl.append(content, actionBtnFragments.getButtonActionElements())
            return liEl
        }

        #renderTasks(taskList) {
            let list = taskList.length === 0 ? this.#tasks.getAllTasks() : taskList
            const fragUlEl = document.createDocumentFragment()
            list.forEach( task => {
                const liElem = this.#createTaskElement(task)
                fragUlEl.appendChild(liElem)
            })
            this.ulElement.innerHTML = ''
            this.ulElement.append(fragUlEl)
        }

        #renderTask() {
            const fragmentEl = this.#createTaskElement(this.#tasks.getLastChild())        
            this.ulElement.appendChild(fragmentEl)
        }

        #addTaskElement() {
            const task = this.inputElement.value.trim()
            if (!task) {
                throw Error('Task is Empty')
            }
        
            this.#tasks.addTask(task)
            this.#renderTask()
            this.inputElement.value = ''
        }

        #completeATask(element) {
            const oldEl = element.childNodes[0]
            let newEl
            if (oldEl.tagName !== 'S') {
                newEl = document.createElement('s')
                newEl.innerText = oldEl.nodeValue
            } else {
                newEl = document.createTextNode(oldEl.innerText)
            }
            element.replaceChild(newEl, element.childNodes[0])
        }

        #removeTask(element) {
            let task = element.childNodes[0]
            task = task.tagName && task.tagName === 'S' ? task.innerText : task.nodeValue
            this.#tasks.removeTask(task)
            element.remove()
        }

        #handleUlEvent(event) {
            if (event.target.tagName === 'BUTTON') {
                const parentTarget = event.target.parentElement.parentElement
                const action = event.target.innerText
                switch (action) {
                    case ICONS.TOGGLE_SELECT:
                        this.#completeATask(parentTarget)
                        break;
                    case ICONS.REMOVE: 
                        this.#removeTask(parentTarget)
                        break;
                    default:
                        break;
                }
            }
        }

        #handleInputEvent(event) {
            const task = this.inputElement.value.trim()
            if (event.key === 'Enter' && task) {
                this.#addTaskElement()
            } else if (this.inputCheckBoxElement.checked && this.#tasks.isNotEmpty()) {
                this.#renderTasks(this.#tasks.filterTasks(task))
            }
        }

        #initiateEvents() {
            this.#btnEvent = this.addBtnElement.addEventListener('click', this.#addTaskElement.bind(this))
            this.#ulEvent = this.ulElement.addEventListener('click', this.#handleUlEvent.bind(this))
            this.#inputEvent = this.inputElement.addEventListener('keyup', this.#handleInputEvent.bind(this))
        }

        #renderMainContent() {
            const sectionEl = document.createElement('section')
            sectionEl.id = 'task-container'
            this.inputElement.id = 'task-input'
            this.inputElement.placeholder = 'New Task...'
            this.inputElement.type = 'text'

            this.addBtnElement.id = 'btn-add-task'
            this.addBtnElement.innerHTML = 'Add Task'

            this.inputCheckBoxElement.type = 'checkbox'
            this.inputCheckBoxElement.id = 'filter-input'
            this.inputCheckBoxElement.name = 'filter-input'

            const labelElement = document.createElement('label')
            labelElement.setAttribute('for', 'filter-input')
            labelElement.innerText = 'Filter'

            sectionEl.append(this.inputElement, this.addBtnElement, this.inputCheckBoxElement, labelElement)

            this.ulElement.id = 'task-list'

            this.shadowRoot.append(sectionEl, this.ulElement)            
        }

        disconnectedCallback() {
            document.removeEventListener(this.#btnEvent)
            document.removeEventListener(this.#ulEvent)
            document.removeEventListener(this.#inputEvent)
            // Code to run when the element is removed from the DOM
        }
    }

    customElements.define('mir-todo-app', MyCustomElement);