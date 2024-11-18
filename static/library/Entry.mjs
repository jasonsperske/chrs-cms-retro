export class Entry {
    #id
    #mediaType
    #title
    #author
    #publishedBy
    #publishedOn
    #publishedLocation
    #edition
    #editionYear
    #serialNumber
    #catalogNumber
    #section

    constructor(title, mediaType, rest = {}) {
        this.#title = title
        this.#mediaType = mediaType

        this.#id = rest.id
        this.#author = rest.author
        this.#publishedBy = rest.publishedBy
        this.#publishedLocation = rest.publishedLocation
        this.#publishedOn = rest.publishedOn
        this.#edition = rest.edition
        this.#editionYear = rest.editionYear
        this.#serialNumber = rest.serialNumber
        this.#catalogNumber = rest.catalogNumber
        this.#section = rest.section
    }

    get id() { return this.#id }
    get title() { return this.#title }
    get mediaType() { return this.#mediaType }
    get author() { return this.#author }
    get publishedBy() { return this.#publishedBy }
    get publishedLocation() { return this.#publishedLocation }
    get publishedOn() { return this.#publishedOn }
    get edition() { return this.#edition }
    get editionYear() { return this.#editionYear }
    get serialNumber() { return this.#serialNumber }
    get catalogNumber() { return this.#catalogNumber }
    get section() { return this.#section }

    asFormData() {
        const data = new FormData()

        data.append("mediaType", this.#mediaType);
        data.append("title", this.#title);
        data.append("author", this.#author ?? "");
        data.append("publishedBy", this.#publishedBy ?? "");
        data.append("publishedOn", this.#publishedOn ?? "");
        data.append("publishedLocation", this.#publishedLocation ?? "");
        data.append("edition", this.#edition ?? "");
        data.append("editionYear", this.#editionYear ?? "");
        data.append("serialNumber", this.#serialNumber ?? "");
        data.append("catalogNumber", this.#catalogNumber ?? "");
        data.append("section", this.#section ?? "")

        return data
    }

    static async fromResponse(res) {
        return Entry.fromJSON(await res.json())
    }

    static fromJSON(data) {
        return new Entry(data.title, data.mediaType, { ...data })
    }

    /**
     * @param {(entry: Entry) => void} onClick 
     * @returns {HTMLDivElement}
     */
    createVariationCard(onClick) {
        const el = document.createElement('div')
        el.classList.add('variation-card')
        el.innerHTML = `
            <h3>${this.#title} (${this.#mediaType})</h3>
            ${this.#author ? `<p>by ${this.#author}</p>` : ""}
            <p>
                ${this.#publishedBy ? `published by ${this.#publishedBy}` : ""}
                ${this.#publishedLocation ? `, ${this.#publishedLocation}` : ""}
                ${this.#publishedOn ? ` (${this.#publishedOn})` : ""}
            </p>
            <p>
                ${this.#edition ? `Edition ${this.#edition}` : ""}
                ${this.#editionYear ? ` (${this.#editionYear})` : ""}
            </p>
            ${this.#serialNumber ? `<p>isbn:${this.#serialNumber}</p>` : ""}
            ${this.#catalogNumber ? `<p>catalog:${this.#catalogNumber}</p>` : ""}
        `
        el.addEventListener('click', () => onClick(this))
        return el
    }

    /**
     * @param {HTMLTemplateElement} template 
     * @returns {HTMLTableRowElement}
     */
    createTableRow(template) {
        const row = template.content.firstElementChild.cloneNode(true)
        row.dataset.id = this.#id
        const fields = row.querySelectorAll('[data-field]')
        fields.forEach(field => {
            field.textContent = this[field.dataset.field]
        })
        return row
    }

    withId(id) {
        this.#id = id
        return this
    }

    /**
     * @param {Entry} that 
     * @returns {boolean} if two entries refer to the same record
     */
    is(that) {
        return this.id === that.id
    }
}