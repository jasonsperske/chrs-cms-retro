from .Entry import Entry
from .Section import Section

class Library:
    def __init__(self, sections):
        self.sections = sections
    
    def fetch(db):
        sections = []
        rows = db.select('library', order="section ASC, title ASC")
        curr_section_name = None
        curr_section_entries = []
        for row in rows:
            entry = Entry(**row)
            
            if curr_section_name is None:
                curr_section_name = entry.section
                curr_section_entries.append(entry)
            elif curr_section_name != entry.section:
                sections.append(Section(curr_section_name, curr_section_entries))
                curr_section_name = entry.section
                curr_section_entries = [entry]
            else:
                curr_section_entries.append(entry)
        
        sections.append(Section(curr_section_name, curr_section_entries))
        
        return Library(sections)