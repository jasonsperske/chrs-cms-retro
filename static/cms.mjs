/**
 * Sets up the uploader from a form element
 * @param {HTMLFormElement} el root element
 */
function setupUploader(el) {
    /** @type{Element} */
    const imageBucket = el.querySelector("#image-bucket")
    /** @type{Element} */
    const imageBucketThumbnails = imageBucket.querySelector('#image-bucket-thumbnails')
    /** @type{HTMLButtonElement} */
    const submitButton = el.querySelector('button[type=submit]')

    /** @type{File[]} */
    let filecache = []
    let isProcessing = false

    function setIsProcessing(is) {
        isProcessing = is
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

    imageBucket.addEventListener('dragover', function (event) {
        event.preventDefault()
    }, false)

    imageBucket.addEventListener('drop', function (/** @type{DragEvent} */ event) {
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
        event.preventDefault()
        const formData = new FormData();
        /** @type{HTMLInputElement | null} */
        const section = el.querySelector('input[name=section]')
        filecache.forEach((file) => formData.append("files", file));
        fetch("/api/openai/vision", { method: "POST", body: formData })
            .then((response) => response.json())
            .then((data) => {
                if (!data.success) {
                    throw new Error("Failed to process images");
                }
                const payload = data.response.choices[0].message.content;
                if (payload.startsWith("```json") && payload.endsWith("```")) {
                    console.log(JSON.parse(payload.slice(7, -3)), section.value)
                } else {
                    throw new Error("Failed to parse response");
                }
            })
            .finally(() => setIsProcessing(false));
    }, false)
}

setupUploader(document.querySelector('#uploader'))
/** @type{HTMLDialogElement} */
const editorDialog = document.querySelector('dialog')

// Close dialog if you click outside of it
// adapted from https://stackoverflow.com/a/26984690/16959
editorDialog.addEventListener('click', function (event) {
    const rect = editorDialog.getBoundingClientRect();
    if (!(rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX && event.clientX <= rect.left + rect.width)) {
        editorDialog.close();
    }
})

/** @type{HTMLTableElement} */
const libraryTable = document.querySelector('#library')

libraryTable.addEventListener('click', function (event) {
    /** @type{HTMLTableRowElement} */
    const row = event.target.parentNode
    if (row.className.includes('entry')) {
        fetch(`/entry/${row.dataset['id']}.json`)
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
                    editorDialog.showModal();
                } else {
                    throw new Error("Cannot find entry")
                }
            })
    }
}, false)