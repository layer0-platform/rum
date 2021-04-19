import getSelectorForElement from '../src/getSelectorForElement'

describe('getSelectorForElement', () => {
  let root, childWithId, childWithClass

  beforeAll(() => {
    root = document.createElement('main')
    childWithId = document.createElement('div')
    childWithId.setAttribute('id', 'child')
    childWithClass = document.createElement('p')
    childWithClass.classList.add('class1')
    childWithClass.classList.add('class2')
    document.body.appendChild(root)
    root.appendChild(childWithId)
    childWithId.appendChild(childWithClass)
  })

  it('should generate a selector using ids and classes', () => {
    expect(getSelectorForElement(childWithClass)).toEqual(['#child', 'p.class1.class2'])
  })
})
