const { v4: uuidv4 } = require('uuid');

// Migration core function
// @param content=Object
const formatBuilderData = async (content, name) => {
    // return new Promise((resolve, reject) => {
    const data = {
        name: name,
        section: {
            ids: [],
            entries: {}
        },
        column: {},
        component: {},
        selected: null,
        selectedType: ''
    };

    content.section.forEach(sectionItem => {
        // Section processing
        data.section.ids.push(sectionItem.id);
        data.section.entries[sectionItem.id] = {
            id: sectionItem.id,
            type: sectionItem.type,
            style: {
                ...sectionItem.style,
                margin: sectionItem.style.margin
                    ? sectionItem.style.margin
                    : { top: 0, right: 0, bottom: 0, left: 0 },
                isGradient: false,
                isGradientAnimated: false,
                gradientDirection: 'to right',
                gradientColorOne: '#37D5D6',
                gradientColorTwo: '#36096D',
                gradientColorThree: '',
                bgBlendMode: 'normal'
            },
            columnGap: sectionItem.columnGap,
            fullWidth: sectionItem.fullWidth,
            children: []
        };

        // column process and push column id to associate section children
        sectionItem.columns.forEach(columnItem => {
            const columnId = uuidv4();
            data.section.entries[sectionItem.id].children.push(columnId);
            data.column[columnId] = {
                id: columnId,
                style: {
                    ...columnItem.style,
                    isGradient: false,
                    isGradientAnimated: false,
                    gradientDirection: 'to right',
                    gradientColorOne: '#37D5D6',
                    gradientColorTwo: '#36096D',
                    gradientColorThree: '',
                    bgBlendMode: 'normal'
                },
                children: []
            };

            // component process and push component id to associate column children
            columnItem.components.forEach(component => {
                data.column[columnId].children.push(component.id);
                switch (component.type) {
                    case 'heading':
                    case 'paragraph':
                        data.component[component.id] = {
                            id: component.id,
                            type: component.type,
                            data: component.data,
                            markup: component.markup,
                            link: component.link,
                            style: {
                                padding: component.style.padding,
                                margin: component.style.margin,
                                bgColor: component.style.bgColor,
                                text: {
                                    size: component.style.text.size,
                                    weight: component.style.text.weight,
                                    color: component.style.text.color,
                                    align: component.style.text.align,
                                    transform: component.style.text.transform,
                                    lineHeight: component.style.text.lineHeight
                                        ? component.style.text.lineHeight
                                        : 0,
                                    letterSpacing: component.style.text
                                        .letterSpacing
                                        ? component.style.text.letterSpacing
                                        : 0,
                                    fontFamily: component.style.fontFamily
                                        ? component.style.fontFamily
                                        : component.style.text.fontFamily
                                        ? component.style.text.fontFamily
                                        : 'Poppins'
                                },
                                maxWidth: '100%'
                            }
                        };
                        break;
                    case 'button':
                        data.component[component.id] = {
                            id: component.id,
                            type: component.type,
                            data: component.data,
                            link: component.link,
                            style: {
                                padding: component.style.padding,
                                margin: component.style.margin,
                                height: component.style.height,
                                width: component.style.width,
                                border: component.style.border,
                                rounded: component.style.rounded,
                                bgColor: component.style.bgColor,
                                text: {
                                    size: component.style.text.size,
                                    weight: component.style.text.weight,
                                    color: component.style.text.color,
                                    align: component.style.text.align,
                                    transform: component.style.text.transform,
                                    lineHeight: component.style.text.lineHeight
                                        ? component.style.text.lineHeight
                                        : 0,
                                    letterSpacing: component.style.text
                                        .letterSpacing
                                        ? component.style.text.letterSpacing
                                        : 0,
                                    fontFamily: component.style.fontFamily
                                        ? component.style.fontFamily
                                        : component.style.text.fontFamily
                                        ? component.style.text.fontFamily
                                        : 'Poppins'
                                },
                                justifyContent: component.style.justifyContent
                            }
                        };
                        break;

                    case 'image':
                    case 'video':
                    case 'divider':
                    case 'sitelogo':
                        data.component[component.id] = {
                            ...component,
                            id: component.id
                        };
                        break;

                    case 'slider':
                        data.component[component.id] = {
                            ...component,
                            id: component.id,
                            type: 'sliderLegecy'
                        };
                        break;

                    case 'list':
                        data.component[component.id] = {
                            ...component,
                            id: component.id,
                            style: {
                                ...component.style,
                                text: {
                                    ...component.style.text,
                                    lineHeight: component.style.text.lineHeight
                                        ? component.style.text.lineHeight
                                        : 0,
                                    letterSpacing: component.style.text
                                        .letterSpacing
                                        ? component.style.text.letterSpacing
                                        : 0,
                                    fontFamily: component.style.fontFamily
                                        ? component.style.fontFamily
                                        : component.style.text.fontFamily
                                        ? component.style.text.fontFamily
                                        : 'Poppins'
                                }
                            }
                        };
                        break;

                    case 'accordion':
                        if (component.headingStyle.text) {
                            data.component[component.id] = {
                                ...component,
                                id: component.id,
                                headingStyle: {
                                    text: {
                                        ...component.headingStyle.text,
                                        lineHeight: component.headingStyle.text
                                            .lineHeight
                                            ? component.headingStyle.text
                                                  .lineHeight
                                            : 0,
                                        letterSpacing: component.headingStyle
                                            .text.letterSpacing
                                            ? component.headingStyle.text
                                                  .letterSpacing
                                            : 0,
                                        fontFamily: component.headingStyle
                                            .fontFamily
                                            ? component.headingStyle.fontFamily
                                            : component.headingStyle.text
                                                  .fontFamily
                                            ? component.headingStyle.text
                                                  .fontFamily
                                            : 'Poppins'
                                    }
                                },
                                textStyle: {
                                    text: {
                                        ...component.headingStyle.text,
                                        lineHeight: component.headingStyle.text
                                            .lineHeight
                                            ? component.headingStyle.text
                                                  .lineHeight
                                            : 0,
                                        letterSpacing: component.headingStyle
                                            .text.letterSpacing
                                            ? component.headingStyle.text
                                                  .letterSpacing
                                            : 0,
                                        fontFamily: component.headingStyle
                                            .fontFamily
                                            ? component.headingStyle.fontFamily
                                            : component.headingStyle.text
                                                  .fontFamily
                                            ? component.headingStyle.text
                                                  .fontFamily
                                            : 'Poppins'
                                    }
                                }
                            };
                        } else {
                            data.component[component.id] = {
                                ...component,
                                id: component.id,
                                headingStyle: {
                                    text: {
                                        size: component.headingStyle.size,
                                        weight: component.headingStyle.weight,
                                        color: component.headingStyle.color,
                                        align: component.headingStyle.align,
                                        transform:
                                            component.headingStyle.transform,
                                        lineHeight: 0,
                                        letterSpacing: 0,
                                        fontFamily: component.headingFontFamily
                                    }
                                },
                                textStyle: {
                                    text: {
                                        size: component.headingStyle.size,
                                        weight: component.headingStyle.weight,
                                        color: component.headingStyle.color,
                                        align: component.headingStyle.align,
                                        transform:
                                            component.headingStyle.transform,
                                        lineHeight: 0,
                                        letterSpacing: 0,
                                        fontFamily: component.headingFontFamily
                                    }
                                }
                            };
                        }
                        break;
                    case 'testimonial':
                        data.component[component.id] = {
                            ...component,
                            id: component.id,
                            duration: 5000,
                            heading: {
                                margin: component.heading.margin,
                                padding: component.heading.padding,
                                font: {
                                    ...component.heading.font,
                                    fontFamily: component.heading.fontFamily
                                        ? component.heading.fontFamily
                                        : component.heading.font.fontFamily
                                        ? component.heading.font.fontFamily
                                        : 'Poppins'
                                },
                                visibility: component.heading.visibility
                            },
                            subHeading: {
                                margin: component.subHeading.margin,
                                padding: component.subHeading.padding,
                                font: {
                                    ...component.subHeading.font,
                                    fontFamily: component.subHeading.fontFamily
                                        ? component.subHeading.fontFamily
                                        : component.subHeading.font.fontFamily
                                        ? component.subHeading.font.fontFamily
                                        : 'Poppins'
                                },
                                visibility: component.subHeading.visibility
                            },
                            text: {
                                margin: component.text.margin,
                                padding: component.text.padding,
                                font: {
                                    ...component.text.font,
                                    fontFamily: component.text.fontFamily
                                        ? component.text.fontFamily
                                        : component.text.font.fontFamily
                                        ? component.text.font.fontFamily
                                        : 'Poppins'
                                },
                                visibility: component.text.visibility
                            }
                        };
                        break;
                    case 'mediaObject':
                        data.component[component.id] = {
                            ...component,
                            id: component.id,
                            heading: {
                                margin: component.heading.margin,
                                padding: component.heading.padding,
                                font: {
                                    ...component.heading.font,
                                    fontFamily: component.heading.fontFamily
                                        ? component.heading.fontFamily
                                        : component.heading.font.fontFamily
                                        ? component.heading.font.fontFamily
                                        : 'Poppins'
                                },
                                visibility: component.heading.visibility
                            },
                            subHeading: {
                                margin: component.subHeading.margin,
                                padding: component.subHeading.padding,
                                font: {
                                    ...component.subHeading.font,
                                    fontFamily: component.subHeading.fontFamily
                                        ? component.subHeading.fontFamily
                                        : component.subHeading.font.fontFamily
                                        ? component.subHeading.font.fontFamily
                                        : 'Poppins'
                                },
                                visibility: component.subHeading.visibility
                            },
                            text: {
                                margin: component.text.margin,
                                padding: component.text.padding,
                                font: {
                                    ...component.text.font,
                                    fontFamily: component.text.fontFamily
                                        ? component.text.fontFamily
                                        : component.text.font.fontFamily
                                        ? component.text.font.fontFamily
                                        : 'Poppins'
                                },
                                visibility: component.text.visibility
                            },

                            button: {
                                margin: component.button.margin,
                                padding: component.button.padding,
                                border: component.button.border,
                                rounded: component.button.rounded,
                                font: {
                                    ...component.button.font,
                                    fontFamily: component.button.fontFamily
                                        ? component.button.fontFamily
                                        : component.button.font.fontFamily
                                        ? component.button.font.fontFamily
                                        : 'Poppins'
                                },
                                visibility: component.button.visibility
                            }
                        };
                        break;

                    case 'menus':
                        data.component[component.id] = {
                            ...component,
                            id: component.id,
                            menuStyle: {
                                ...component.menuStyle,
                                font: {
                                    ...component.menuStyle.font,
                                    fontFamily: component.menuStyle.fontFamily
                                        ? component.menuStyle.fontFamily
                                        : component.menuStyle.font.fontFamily
                                        ? component.menuStyle.font.fontFamily
                                        : 'Poppins'
                                }
                            },

                            titleStyle: {
                                ...component.titleStyle,
                                font: {
                                    ...component.titleStyle.font,
                                    fontFamily: component.titleStyle.fontFamily
                                        ? component.titleStyle.fontFamily
                                        : component.titleStyle.font.fontFamily
                                        ? component.titleStyle.font.fontFamily
                                        : 'Poppins'
                                }
                            }
                        };
                        break;

                    case 'blog-grid':
                    case 'social-icon':
                    case 'form':
                    case 'rentmy':
                        data.component[component.id] = {
                            ...component,
                            id: component.id
                        };
                        break;

                    default:
                        break;
                }
            });
        });
    });

    return data;
    // });
};

module.exports = {
    formatBuilderData
};
