import { AnalyzeBookResponse } from "./openai/AnalyzeBookResponse.mjs"

/** @type{HTMLTableElement} */
const libraryTable = document.querySelector('#library')
/** @type{HTMLTableBodyElement} */
const newEntries = document.querySelector('#new-entries')
/** @type{HTMLTemplateElement} */
const entryTemplate = document.querySelector('#entry-template')

/**
 * Sets up the uploader from a form element
 * @param {HTMLFormElement} el root element
 */
function setupUploader(el) {
    /** @type{Element} */
    const imageBucket = el.querySelector("#image-bucket")
    /** @type{Element} */
    const imageBucketStatus = imageBucket.querySelector('#image-bucket-status')
    /** @type{Element} */
    const imageBucketThumbnails = imageBucket.querySelector('#image-bucket-thumbnails')
    /** @type{Element} */
    const variations = document.querySelector('#variations')
    /** @type{HTMLButtonElement} */
    const submitButton = el.querySelector('button[type=submit]')
    /** @type{HTMLInputElement} */
    const section = el.querySelector('input[name=section]')

    /** @type{File[]} */
    let filecache = []
    let isProcessing = false

    function selectEntry(entry) {
        fetch(
            '/',
            {
                method: "PUT",
                body: entry.asFormData()
            })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    // prepend the entry to the new entries tbody
                    newEntries
                        .prepend(
                            entry.withId(data.response.id)
                                .createTableRow(entryTemplate))
                    // clear the file cache
                    filecache = []
                    // clear the image bucket thumbnails
                    imageBucketThumbnails.innerHTML = ""
                    // clear the variations
                    variations.innerHTML = ""
                } else {
                    throw new Error("Failed to update entry")
                }
            })
    }

    function setIsProcessing(is) {
        isProcessing = is
        submitButton.disabled = isProcessing
        imageBucketStatus.textContent = isProcessing ? "Processing..." : "Drop images here"
    }

    /**
     * Takes file objects and updates the thumbnails showing each uploaded image
     * @param {File[]} files 
     */
    function updateThumbnails(files) {
        filecache = [...filecache, ...files]
        function createImage(file) {
            const image = document.createElement('img')
            image.src = URL.createObjectURL(file)
            image.alt = file.name
            return image
        }

        function createRemoveButton(file, index) {
            const removeButton = document.createElement('button')
            removeButton.innerHTML = '&times;'
            removeButton.addEventListener('click', function (/** @type{Event} */ event) {
                filecache = filecache.filter((_, i) => i !== index)
                event.target.parentNode.parentNode.removeChild(event.target.parentNode)
                submitButton.disabled = filecache.length === 0
            })
            return removeButton
        }

        files.forEach((file, index) => {
            const thumbnail = document.createElement('div')
            thumbnail.appendChild(createImage(file))
            thumbnail.appendChild(createRemoveButton(file, index))
            imageBucketThumbnails.appendChild(thumbnail)
        })
        submitButton.disabled = filecache.length === 0
    }

    el.addEventListener('dragover', function (event) {
        event.preventDefault()
    }, false)

    el.addEventListener('drop', function (/** @type{DragEvent} */ event) {
        event.preventDefault()
        if (event.dataTransfer.items) {
            updateThumbnails([
                ...Array.from(event.dataTransfer.items)
                    .filter(
                        (item) => item.kind === "file" && item.type.startsWith("image/")
                    )
                    .map((item) => item.getAsFile())
                    .filter((x) => x !== null)
            ])
        }
    }, false)

    el.addEventListener('submit', function (event) {
        event.preventDefault();
        setIsProcessing(true)
        const formData = new FormData()
        filecache.forEach((file) => formData.append("files", file))
        fetch("/api/openai/vision", { method: "POST", body: formData })
            .then((response) => response.json())
            .then((data) => {
                if (!data.success) {
                    throw new Error("Failed to process images")
                }
                const payload = data.response;
                if (payload.startsWith("```json") && payload.endsWith("```")) {
                    const analyzedBookResponse = new AnalyzeBookResponse(JSON.parse(payload.slice(7, -3)), section.value)
                    variations.innerHTML = ""
                    for (const interpretation of analyzedBookResponse.interpretations) {
                        variations.appendChild(interpretation.createVariationCard(selectEntry))
                    }
                } else {
                    throw new Error("Failed to parse response")
                }
            })
            .catch((error) => {
                variations.textContent = error.message
            })
            .finally(() => {
                setIsProcessing(false)
            });
    }, false)
}

setupUploader(document.querySelector('#uploader'))
/** @type{HTMLDialogElement} */
const editorDialog = document.querySelector('dialog#editor-dialog')
/** @type{HTMLFormElement} */
const editorForm = editorDialog.querySelector('form#editor-form')
/** @type{HTMLButtonElement} */
const editorConfirmDeleteButton = editorDialog.querySelector('button[role="delete"]')

/** @type{HTMLDialogElement} */
const deleteDialog = document.querySelector('dialog#delete-dialog')
/** @type{HTMLFormElement} */
const deleteForm = deleteDialog.querySelector('form#delete-form')
/** @type{HTMLButtonElement} */
const deleteCancelButton = deleteDialog.querySelector('button[role="cancel"]')

// Close dialog if you click outside of it
// adapted from https://stackoverflow.com/a/26984690/16959
editorDialog.addEventListener('click', function (event) {
    const rect = editorDialog.getBoundingClientRect();
    if (!(rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX && event.clientX <= rect.left + rect.width)) {
        editorDialog.close()
    }
})

deleteDialog.addEventListener('click', function (event) {
    const rect = deleteDialog.getBoundingClientRect();
    if (!(rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX && event.clientX <= rect.left + rect.width)) {
        deleteDialog.close()
    }
})

libraryTable.addEventListener('click', function (event) {
    /** @type{HTMLTableRowElement} */
    const row = event.target.parentNode
    if (row.className.includes('entry')) {
        const url = `/entry/${row.dataset['id']}.json`
        fetch(url)
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    Object.keys(data.response).forEach((key) => {
                        /** @type{HTMLInputElement | null} */
                        const input = editorDialog.querySelector(`input[name='${key}']`)
                        if (input) {
                            input.value = data.response[key]
                        }
                    });
                    editorForm.action = url
                    editorDialog.showModal()
                } else {
                    throw new Error("Cannot find entry")
                }
            })
    }
}, false)

editorForm.addEventListener('submit', function (event) {
    event.preventDefault()
    fetch(editorForm.action, { method: "POST", body: new FormData(editorForm) })
        .then((response) => response.json())
        .then((data) => {
            editorDialog.close()
            // find table row associated with this entry
            const row = libraryTable.querySelector(`tr[data-id='${data.response.id}']`)
            if (row) {
                // update the row with the new data
                Object.keys(data.response).forEach((key) => {
                    // find fields with data-field attribute matching key
                    const field = row.querySelector(`[data-field='${key}']`)
                    if (field) {
                        field.textContent = data.response[key]
                    }
                })
            }
        })
}, false)

deleteForm.addEventListener('submit', function (event) {
    event.preventDefault()
    fetch(deleteForm.action, { method: "DELETE", body: new FormData(deleteForm) })
        .then((response) => response.json())
        .then((data) => {
            deleteDialog.close()
            editorDialog.close()
            // find table row associated with this entry and remove it
            const row = libraryTable.querySelector(`tr[data-id='${data.response.id}']`)
            if (row) {
                row.remove()
            }
        })
}, false)

editorConfirmDeleteButton.addEventListener('click', function (event) {
    event.preventDefault()
    deleteForm.action = editorForm.action
    deleteDialog.showModal()
}, false)

deleteCancelButton.addEventListener('click', function (event) {
    deleteDialog.close()
    editorDialog.close()
}, false)