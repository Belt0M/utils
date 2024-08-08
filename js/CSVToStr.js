let translations = {}
let englishTranslations = {}
let baseLconf = {}

document
	.getElementById('englishFileInput')
	.addEventListener('change', function (event) {
		const label = document.querySelector('label[for="englishFileInput"]')

		const file = event.target.files[0]

		if (file && label) {
			label.innerText = file.name

			const reader = new FileReader()
			reader.onload = function (e) {
				englishTranslations = JSON.parse(e.target.result).keys
			}
			reader.readAsText(file)
		}
	})

document
	.getElementById('csvFileInput')
	.addEventListener('change', function (event) {
		const label = document.querySelector('label[for="csvFileInput"]')

		const file = event.target.files[0]

		if (file) {
			label.innerText = file.name

			const reader = new FileReader()
			reader.onload = function (e) {
				const text = e.target.result
				const lines = text.split('\r\n')
				const headers = lines[0].split(',')

				for (let i = 1; i < headers.length; i++) {
					translations[headers[i]] = {}
				}

				for (let i = 1; i < lines.length; i++) {
					if (lines[i].trim() === '') continue

					const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)

					const key = row[0]

					for (let j = 1; j < headers.length; j++) {
						translations[headers[j]][key] = row[j]
							.replace(/(^"|"$)/g, '')
							.replace(/\\n/g, '\n')
					}
				}
			}
			reader.readAsText(file)
		}
	})

document
	.getElementById('lconfFileInput')
	.addEventListener('change', function (event) {
		const label = document.querySelector('label[for="lconfFileInput"]')

		const file = event.target.files[0]

		if (file) {
			label.innerText = file.name

			const reader = new FileReader()
			reader.onload = function (e) {
				baseLconf = JSON.parse(e.target.result)
			}
			reader.readAsText(file)
		}
	})

async function generateAndDownloadZip() {
	if (Object.keys(englishTranslations).length === 0) {
		alert('Please upload the English STR file first.')
		return
	}
	if (Object.keys(baseLconf).length === 0) {
		alert('Please upload the base LCONF file first.')
		return
	}

	const zip = new JSZip()

	const stringsFolder = zip.folder('strings')
	const labelsFolder = zip.folder('labels')

	for (const lang in translations) {
		if (lang === 'EN') continue

		const lowerCaseLang = lang.toLowerCase()

		const strContent = {
			meta: {
				includes: [],
			},
			keys: {},
		}

		for (const key in englishTranslations) {
			strContent.keys[key] = translations[lang][key] || englishTranslations[key]
		}

		const jsonStr = JSON.stringify(strContent, null, 4)
		const strLangFolder = stringsFolder.folder(lowerCaseLang)

		strLangFolder.file('base.str', jsonStr)

		strLangFolder.file(
			'rules.str',
			JSON.stringify({'01_t': 'Game Rules'}, null, 4)
		)
		strLangFolder.file(
			'ui_base.str',
			JSON.stringify(
				{
					meta: {
						includes: [],
					},
					keys: {
						BS_UI_: '',
					},
				},
				null,
				4
			)
		)
		strLangFolder.file(
			'ui_bg.str',
			JSON.stringify(
				{
					meta: {
						includes: [],
					},
					keys: {},
				},
				null,
				4
			)
		)

		const lconfContent = {}

		for (const key in baseLconf) {
			const item = {...baseLconf[key]}

			if (item.font_id) {
				item.font_id = item.font_id.replace(/EN_/g, `${lang}_`)
			}

			lconfContent[key] = item
		}

		const lconfLangFolder = labelsFolder.folder(lowerCaseLang)

		lconfLangFolder.file('base.lconf', JSON.stringify(lconfContent, null, 4))
		lconfLangFolder.file('ui_base.lconf', '{}')
		lconfLangFolder.file('ui_bg.lconf', '{}')
	}

	const strLangFolderEn = stringsFolder.folder('en')
	const lconfLangFolderEn = labelsFolder.folder('en')

	const strContentEn = {
		meta: {
			includes: [],
		},
		keys: englishTranslations,
	}
	strLangFolderEn.file('base.str', JSON.stringify(strContentEn, null, 4))
	strLangFolderEn.file(
		'rules.str',
		JSON.stringify({'01_t': 'Game Rules'}, null, 4)
	)
	strLangFolderEn.file(
		'ui_base.str',
		JSON.stringify(
			{
				meta: {
					includes: [],
				},
				keys: {
					BS_UI_: '',
				},
			},
			null,
			4
		)
	)
	strLangFolderEn.file(
		'ui_bg.str',
		JSON.stringify(
			{
				meta: {
					includes: [],
				},
				keys: {},
			},
			null,
			4
		)
	)

	const lconfContentEn = {}
	for (const key in baseLconf) {
		lconfContentEn[key] = baseLconf[key]
	}
	lconfLangFolderEn.file('base.lconf', JSON.stringify(lconfContentEn, null, 4))
	lconfLangFolderEn.file('ui_base.lconf', '{}')
	lconfLangFolderEn.file('ui_bg.lconf', '{}')

	const content = await zip.generateAsync({type: 'blob'})

	const link = document.createElement('a')
	link.href = URL.createObjectURL(content)
	link.download = `locale.zip`
	link.click()
}
