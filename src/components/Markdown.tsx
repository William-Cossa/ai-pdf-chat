 import React from 'react'
 import markdownit from 'markdown-it'
 type Props = {
    text: string;
 }
 

 const md = markdownit();

 const Markdown = ({text}: Props) => {
    const html = md.render(text)
    return <div className='whitespace-pre-wrap' dangerouslySetInnerHTML={{__html: html}} />

 }
 
 export default Markdown