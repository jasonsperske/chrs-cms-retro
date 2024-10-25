class Entry:
    def __init__(self, title, mediaType, **kwargs):
        self.title = title
        self.mediaType = mediaType
        
        self.id = kwargs['id']
        self.author = kwargs['author']
        self.publishedBy = kwargs['publishedBy']
        self.publishedLocation = kwargs['publishedLocation']
        self.publishedOn = kwargs['publishedOn']
        self.edition = kwargs['edition']
        self.editionYear = kwargs['editionYear']
        self.serialNumber = kwargs['serialNumber']
        self.catalogNumber = kwargs['catalogNumber']
        self.section = kwargs['section']
    
    @property
    def Publisher(self):
        return " ".join([self.publishedBy, self.publishedLocation, self.publishedOn])
    
    @property
    def Edition(self):
        return self.edition + (" ({})".format(self.editionYear) if len(self.editionYear) else "")
    
    @property
    def SerialNumbers(self):
        return " ".join(filter(len, [
            "isbn:{}".format(self.serialNumber) if len(self.serialNumber) else "",
            "catalog:{}".format(self.catalogNumber) if len(self.catalogNumber) else ""
        ]))
    
    def fetch(id, db):
        params = dict(id=id)
        try:
            row = db.select('library', vars=params, where="id=$id")[0]
            return Entry(**row)
        except IndexError:
            return None
    
    def to_dict(self):
        return vars(self)