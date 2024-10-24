# CHRS-CMS (retro edition)
A CMS to help run the CHRS Library built on top of python2

## How to setup an envrionment

### MacOS High Sierra (10.13)
In envrionments where Python3 and virtual envrionments aren't available you can install the following deps:

    pip install web.py
    pip install sqlite-web
    pip install Pillow
    pip install openai
    pip install python-dotenv

### Modern Python envrionments
Install venv (with a command such as `sudo apt install python3.12-vent` or whatever is appropriate for your OS) then run the follwoing command to create a virtual envrioment:

    python3 -m venv .
    source ./bin/activate

Once inside you can install the dependencies:

    pip install web.py
    pip install sqlite-web
    pip install Pillow
    pip install openai
    pip install python-dotenv

