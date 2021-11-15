export const sleep = (time: number) =>
    new Promise((r) => {
        setTimeout(r, time);
    });

export const removeNewLine = (str: string) => str.replace(/\n/g, '');
export const replaceEmptyParagraphs = (str: string) => str.replace(/<p><\/p>/g, '<br />');
export const replaceParagraphsTags = (str: string) => str.replace(/<p>/g, '<div>').replace(/<\/p>/g, '</div>');

export const removeParagraphsFromEmailContents = (emailContent: string): string => {
    return replaceParagraphsTags(replaceEmptyParagraphs(removeNewLine(emailContent)));
};
