import os
from lxml import html
from lxml import etree
from distutils.dir_util import copy_tree
from string import Template
import os.path
import json

def getJsFiles(mydir="../examples"):
    files=[]
    for file in os.listdir(mydir):
        if file.endswith(".js"):
            files.append(os.path.join(mydir, file))
    return files
    
def copyDirectory(src="../examples/data", dest="../tutorials/data"):
    copy_tree(src, dest)

def createTutoDirectory():
    path = "../tutorials"
    if not os.path.exists(path):
        os.makedirs(path)


def getMeta(doc):
    childrens = []
    meta_title_element = doc.xpath("//meta[@name='title']")
    meta_title = meta_title_element[0].get('content').strip()

    meta_children_elements = doc.xpath("//meta[@name='children']")
    for elt in meta_children_elements:
        childrens.append(elt.get('content'.strip()))

    meta_description_element = doc.xpath("//meta[@name='description']")
    if len(meta_description_element) == 0:
        meta_description = ""
    else:
        meta_description = meta_description_element[0].get('content').strip()

    node = doc.xpath("//html/body/*")
    body=""
    for nodeElt in node:
        if nodeElt.tag != "script":
            body = body+etree.tostring(nodeElt).strip()
    return [meta_title, meta_description, childrens, body]

def createHtmlPages(htmlFile, jsFile, meta_title, meta_desc, body, dst="../tutorials/"):
    js = open(jsFile).read()
    d={
        'title':meta_title,
        'article':meta_desc,
        'script_js':js,
        'body':body
    }
    result = src.substitute(d)
    basename = os.path.basename(htmlFile)
    file = open(dst+basename,"w") 
    file.write(result)    
    file.close()

def createNavigation(htmlFile, meta_title, childrens, dst="../tutorials/"):
    result = {
        "title":meta_title
    }
    if len(childrens) != 0:
        result["children"] = childrens
    basename = os.path.basename(htmlFile)
    basename = basename.replace(".html",".json")
    file = open(dst+basename,"w") 
    file.write(json.dumps(result))    
    file.close()


createTutoDirectory()
copyDirectory()
copyDirectory("../examples/resources", "../tutorials/resources")

filein = open( 'templateCodeMirror.tmpl' )
src = Template( filein.read() )

jsFiles = getJsFiles()
for jsFile in jsFiles:
    try:
        htmlFile = jsFile.replace(".js",".html")
        htmlContent= open(htmlFile).read()
        doc = html.document_fromstring(htmlContent)
        meta_title, meta_desc, childrens, body = getMeta(doc)
        createHtmlPages(htmlFile, jsFile, meta_title, meta_desc, body)
        createNavigation(htmlFile, meta_title, childrens)
    except Exception as message:
        print("Error with "+jsFile+" : "+str(message)) 
