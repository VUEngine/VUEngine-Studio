/* See https://jsonforms.io for more information on how to configure data and ui schemas. */

export const registeredProjectNodes = {
  Project: {
    title: 'Project Settings',
    leaf: true,
    children: {
    },
    icon: 'fa fa-cog'
  },
  BrightnessRepeats: {
    title: 'Brightness Repeat',
    leaf: false,
    children: {
      BrightnessRepeat: {
        addOrRemovable: true
      }
    },
    icon: 'fa fa-sun-o'
  },
  ColumnTables: {
    title: 'Column Table',
    leaf: false,
    children: {
      ColumnTable: {
        addOrRemovable: true
      }
    },
    icon: 'fa fa-table'
  },
  Entities: {
    title: 'Entities',
    leaf: false,
    children: {
      Entity: {
        addOrRemovable: true
      }
    },
    icon: 'fa fa-id-card-o'
  },
  Fonts: {
    title: 'Fonts',
    leaf: false,
    children: {
      Font: {
        addOrRemovable: true
      }
    },
    icon: 'fa fa-font'
  },
  Images: {
    title: 'Images',
    leaf: false,
    children: {
      Image: {
        addOrRemovable: true
      }
    },
    icon: 'fa fa-image'
  },
  Languages: {
    title: 'Internationalization',
    leaf: false,
    children: {
      Language: {
        addOrRemovable: true
      }
    },
    icon: 'fa fa-language'
  },
  RumbleEffects: {
    title: 'RumbleEffects',
    leaf: false,
    children: {
      RumbleEffect: {
        addOrRemovable: true
      }
    },
    icon: 'codicon codicon-screen-full codicon-rotate-90'
  },
  Sounds: {
    title: 'Sound & Music',
    leaf: false,
    children: {
      Sound: {
        addOrRemovable: true
      }
    },
    icon: 'fa fa-music'
  },
  Stages: {
    title: 'Stages',
    leaf: false,
    children: {
      Stage: {
        addOrRemovable: true
      }
    },
    icon: 'fa fa-cube'
  },
};

export const registeredTypes = {
  Entity: {
    schema: {
      title: 'Entity',
      properties: {
        typeId: {
          const: 'Entity'
        },
        name: {
          type: 'string',
          default: 'Name'
        },
        class: {
          type: 'string',
          default: 'Entity'
        },
        extraInfo: {
          type: 'string'
        },
        pixelSize: {
          type: 'object',
          properties: {
            x: {
              type: 'number',
              minimum: 0
            },
            y: {
              type: 'number',
              minimum: 0
            },
            z: {
              type: 'number',
              minimum: 0
            }
          }
        }
      },
      required: [
        'name'
      ],
      additionalProperties: false
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/name'
        },
        {
          type: 'Control',
          scope: '#/properties/class'
        },
        {
          type: 'Control',
          scope: '#/properties/extraInfo'
        },
        {
          type: 'Group',
          label: 'Size (x, y, z)',
          elements: [
            {
              type: 'HorizontalLayout',
              elements: [
                {
                  type: 'Control',
                  label: false,
                  scope: '#/properties/pixelSize/properties/x'
                },
                {
                  type: 'Control',
                  label: false,
                  scope: '#/properties/pixelSize/properties/y'
                },
                {
                  type: 'Control',
                  label: false,
                  scope: '#/properties/pixelSize/properties/z'
                }
              ]
            }
          ]
        }
      ]
    },
    children: {
      EntityAnimations: {
        addOrRemovable: false
      },
      EntityBehaviors: {
        addOrRemovable: false
      },
      EntityChildren: {
        addOrRemovable: false
      },
      EntityCollisions: {
        addOrRemovable: false
      },
      EntityMeshes: {
        addOrRemovable: false
      },
      EntityPhysics: {
        addOrRemovable: false
      },
      EntitySprites: {
        addOrRemovable: false
      },
    },
    icon: 'fa fa-id-card-o'
  },
  EntityAnimations: {
    schema: {
      title: 'Animations',
      properties: {
        typeId: {
          const: 'EntityAnimations'
        },
        default: {
          type: 'string'
        }
      },
      required: [
      ],
      additionalProperties: false
    },
    children: {
      EntityAnimation: {
        addOrRemovable: true
      }
    },
    icon: 'fa fa-film'
  },
  EntityAnimation: {
    schema: {
      title: 'Animation',
      properties: {
        typeId: {
          const: 'EntityAnimation'
        },
        name: {
          type: 'string'
        },
        cycles: {
          type: 'integer',
          minimum: 0,
          maximum: 255,
          default: 8
        },
        callback: {
          type: 'string'
        },
        loop: {
          type: 'boolean',
          default: false,
        },
        frames: {
          type: 'array',
          items: {
            type: 'integer',
            minimum: 0
          }
        },
      },
      required: [
        'name'
      ],
      additionalProperties: false
    },
    icon: 'fa fa-film'
  },
  EntityBehaviors: {
    schema: {
      title: 'Behaviors',
      properties: {
        typeId: {
          const: 'EntityBehaviors'
        }
      },
      required: [
      ],
      additionalProperties: false
    },
    icon: 'fa fa-map-signs'
  },
  EntityChildren: {
    schema: {
      title: 'Children',
      properties: {
        typeId: {
          const: 'EntityChildren'
        }
      },
      required: [
      ],
      additionalProperties: false
    },
    icon: 'fa fa-sitemap'
  },
  EntityCollisions: {
    schema: {
      title: 'Collisions',
      properties: {
        typeId: {
          const: 'EntityCollisions'
        },
        inGameType: {
          type: 'string',
          default: 'None'
        },
        shapes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: [
                  'LineField',
                  'Box',
                  'InverseBox',
                  'Ball'
                ]
              },
              pixelSize: {
                type: 'object',
                properties: {
                  x: {
                    type: 'number',
                    minimum: 0
                  },
                  y: {
                    type: 'number',
                    minimum: 0
                  },
                  z: {
                    type: 'number',
                    minimum: 0
                  }
                }
              },
              displacement: {
                type: 'object',
                properties: {
                  x: {
                    type: 'number',
                    minimum: 0
                  },
                  y: {
                    type: 'number',
                    minimum: 0
                  },
                  z: {
                    type: 'number',
                    minimum: 0
                  },
                  parallax: {
                    type: 'number',
                    minimum: 0
                  }
                }
              },
              rotation: {
                type: 'object',
                properties: {
                  x: {
                    type: 'number',
                    minimum: 0
                  },
                  y: {
                    type: 'number',
                    minimum: 0
                  },
                  z: {
                    type: 'number',
                    minimum: 0
                  }
                }
              },
              scale: {
                type: 'object',
                properties: {
                  x: {
                    type: 'number',
                    minimum: 0
                  },
                  y: {
                    type: 'number',
                    minimum: 0
                  },
                  z: {
                    type: 'number',
                    minimum: 0
                  }
                }
              },
              checkForCollisions: {
                type: 'boolean',
                default: false
              },
              layers: {
                type: 'string'
              },
              layersToIgnore: {
                type: 'string'
              }
            }
          }
        }
      },
      required: [
      ],
      additionalProperties: false
    },
    icon: 'fa fa-object-ungroup'
  },
  EntityMeshes: {
    schema: {
      title: 'Meshes',
      properties: {
        typeId: {
          const: 'EntityMeshes'
        },
        meshes: {
          type: 'string'
          /*
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fromVertex: {
                type: 'string'
              },
              toVertex: {
                type: 'string'
              },
              bufferIndex: {
                type: 'integer',
                minimum: 0,
                maximum: 255
              }
            }
          }*/
        }
      },
      required: [
      ],
      additionalProperties: false
    },
    icon: 'codicon codicon-globe'
  },
  EntityPhysics: {
    schema: {
      title: 'Physics',
      properties: {
        typeId: {
          const: 'EntityPhysics'
        },
        enabled: {
          type: 'boolean',
          default: false
        },
        mass: {
          type: 'number'
        },
        friction: {
          type: 'number'
        },
        bounciness: {
          type: 'number'
        },
        maximumVelocity: {
          type: 'object',
          properties: {
            x: {
              type: 'number',
              minimum: 0
            },
            y: {
              type: 'number',
              minimum: 0
            },
            z: {
              type: 'number',
              minimum: 0
            }
          }
        },
        maximumSpeed: {
          type: 'number'
        },
      },
      required: [
      ],
      additionalProperties: false
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          label: 'Enable physics',
          scope: '#/properties/enabled'
        },
        {
          type: 'VerticalLayout',
          rule: {
            effect: 'HIDE',
            condition: {
              scope: '#/properties/enabled',
              schema: {
                const: false
              }
            }
          },
          elements: [
            {
              type: 'HorizontalLayout',
              elements: [
                {
                  type: 'Control',
                  scope: '#/properties/mass'
                },
                {
                  type: 'Control',
                  scope: '#/properties/friction'
                },
                {
                  type: 'Control',
                  scope: '#/properties/bounciness'
                }
              ]
            },
            {
              type: 'Group',
              label: 'Maximum Velocity (x, y, z)',
              elements: [
                {
                  type: 'HorizontalLayout',
                  elements: [
                    {
                      type: 'Control',
                      label: false,
                      scope: '#/properties/maximumVelocity/properties/x'
                    },
                    {
                      type: 'Control',
                      label: false,
                      scope: '#/properties/maximumVelocity/properties/y'
                    },
                    {
                      type: 'Control',
                      label: false,
                      scope: '#/properties/maximumVelocity/properties/z'
                    }
                  ]
                }
              ]
            },
            {
              type: 'Control',
              scope: '#/properties/maximumSpeed'
            }
          ]
        }
      ]
    },
    icon: 'fa fa-compass'
  },
  EntitySprites: {
    schema: {
      title: 'Sprites',
      properties: {
        typeId: {
          const: 'EntitySprites'
        },
        type: {
          type: 'string',
          enum: [
            'Bgmap',
            'Object'
          ],
          default: 'Bgmap'
        },
        useZDisplacementInProjection: {
          type: 'boolean',
          default: false
        }
      },
      required: [
      ],
      additionalProperties: false
    },
    children: {
      EntitySprite: {
        addOrRemovable: true
      }
    },
    icon: 'fa fa-picture-o'
  },
  EntitySprite: {
    schema: {
      title: 'Sprite',
      properties: {
        typeId: {
          const: 'EntitySprite'
        },
        name: {
          type: 'string'
        },
        class: {
          type: 'string',
          default: 'BgmapSprite'
        },
        bgmapMode: {
          type: 'string',
          enum: ['BGMAP', 'AFFINE', 'OBJECT', 'HBIAS'],
          default: 'BGMAP'
        },
        displayMode: {
          type: 'string',
          enum: ['Both', 'Left', 'Right'],
          default: 'Both'
        },
        transparency: {
          type: 'string',
          enum: ['None', 'Even', 'Odd'],
          default: 'None'
        },
        displacement: {
          type: 'object',
          properties: {
            x: {
              type: 'number',
              minimum: 0
            },
            y: {
              type: 'number',
              minimum: 0
            },
            z: {
              type: 'number',
              minimum: 0
            },
            parallax: {
              type: 'number',
              minimum: 0
            }
          }
        },
        manipulationFunction: {
          type: 'string'
        },
        texture: {
          type: 'object',
          properties: {
            charset: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: [
                    'animatedSingle',
                    'animatedSingleOptimized',
                    'animatedShared',
                    'animatedSharedCoordinated',
                    'animatedMulti',
                    'notAnimated'
                  ],
                  default: 'notAnimated'
                }
              }
            },
            image: {
              type: 'object',
              properties: {
                name: {
                  type: 'string'
                },
                chars: {
                  type: 'integer',
                  minimum: 0
                }
              }
            },
            padding: {
              type: 'object',
              properties: {
                x: {
                  type: 'integer',
                  minimum: 0
                },
                y: {
                  type: 'integer',
                  minimum: 0
                }
              }
            },
            palette: {
              type: 'integer',
              minimum: 0,
              maximum: 3
            },
            recycleable: {
              type: 'boolean',
              default: false
            },
            size: {
              type: 'object',
              properties: {
                x: {
                  type: 'integer',
                  minimum: 0
                },
                y: {
                  type: 'integer',
                  minimum: 0
                }
              }
            },
          },
        }
      },
      required: [
      ],
      additionalProperties: false
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/name'
        },
        {
          type: 'Control',
          scope: '#/properties/class'
        },
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/bgmapMode'
            },
            {
              type: 'Control',
              scope: '#/properties/displayMode'
            },
            {
              type: 'Control',
              scope: '#/properties/transparency'
            }
          ]
        },
        {
          type: 'HorizontalLayout',
          rule: {
            effect: 'SHOW',
            condition: {
              scope: '#/properties/bgmapMode',
              schema: {
                enum: ['AFFINE', 'HBIAS']
              }
            }
          },
          elements: [
            {
              type: 'Control',
              scope: '#/properties/manipulationFunction'
            }
          ]
        },
        {
          type: 'Group',
          label: 'Displacement (x, y, z, parallax)',
          elements: [
            {
              type: 'HorizontalLayout',
              elements: [
                {
                  type: 'Control',
                  label: false,
                  scope: '#/properties/displacement/properties/x'
                },
                {
                  type: 'Control',
                  label: false,
                  scope: '#/properties/displacement/properties/y'
                },
                {
                  type: 'Control',
                  label: false,
                  scope: '#/properties/displacement/properties/z'
                },
                {
                  type: 'Control',
                  label: false,
                  scope: '#/properties/displacement/properties/parallax'
                }
              ]
            }
          ]
        },
        {
          type: 'Group',
          label: 'Texture',
          elements: [
            {
              type: 'Control',
              label: 'Charset Type',
              scope: '#/properties/texture/properties/charset/properties/type'
            },
            {
              type: 'Group',
              label: 'Image',
              elements: [
                {
                  type: 'HorizontalLayout',
                  elements: [
                    {
                      type: 'Control',
                      scope: '#/properties/texture/properties/image/properties/name'
                    },
                    {
                      type: 'Control',
                      scope: '#/properties/texture/properties/image/properties/chars'
                    }
                  ]
                },
                {
                  type: 'Group',
                  label: 'Padding (X, Y)',
                  elements: [
                    {
                      type: 'HorizontalLayout',
                      elements: [
                        {
                          type: 'Control',
                          label: false,
                          scope: '#/properties/texture/properties/padding/properties/x'
                        },
                        {
                          type: 'Control',
                          label: false,
                          scope: '#/properties/texture/properties/padding/properties/y'
                        }
                      ]
                    }
                  ]
                },
                {
                  type: 'Control',
                  scope: '#/properties/texture/properties/palette'
                },
                {
                  type: 'Control',
                  scope: '#/properties/texture/properties/recycleable'
                },
                {
                  type: 'Group',
                  label: 'Size (X, Y)',
                  elements: [
                    {
                      type: 'HorizontalLayout',
                      elements: [
                        {
                          type: 'Control',
                          label: false,
                          scope: '#/properties/texture/properties/size/properties/x'
                        },
                        {
                          type: 'Control',
                          label: false,
                          scope: '#/properties/texture/properties/size/properties/y'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    icon: 'fa fa-picture-o'
  },
  Image: {
    schema: {
      title: 'Image',
      properties: {
        typeId: {
          const: 'Image'
        },
        images: {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        name: {
          type: 'string'
        },
        section: {
          type: 'string',
          enum: ['rom', 'exp'],
          default: 'rom'
        },
        tileset: {
          type: 'object',
          properties: {
            shared: {
              type: 'boolean',
              default: false
            },
            reduce: {
              type: 'boolean',
              default: false
            },
            compress: {
              type: 'string',
              enum: ['off', 'rle'],
              default: 'off'
            }
          }
        },
        map: {
          type: 'object',
          properties: {
            generate: {
              type: 'boolean',
              default: true
            },
            reduce: {
              type: 'object',
              properties: {
                flipped: {
                  type: 'boolean',
                  default: false
                },
                unique: {
                  type: 'boolean',
                  default: false
                }
              }
            },
            compress: {
              type: 'string',
              enum: ['off', 'rle'],
              default: 'off'
            }
          }
        },
        animation: {
          type: 'object',
          properties: {
            isAnimation: {
              type: 'boolean',
              default: false
            },
            individualFiles: {
              type: 'boolean',
              default: false
            },
            frameWidth: {
              type: 'integer',
              default: 0
            },
            frameHeight: {
              type: 'integer',
              default: 0
            }
          }
        }
      },
      required: [
        'images',
        'section',
      ],
      additionalProperties: false
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          label: 'Images',
          scope: '#/properties/images'
        },
        {
          type: 'Control',
          label: 'Name',
          scope: '#/properties/name'
        },
        {
          type: 'Control',
          label: 'Store in',
          scope: '#/properties/section'
        },
        {
          type: 'Group',
          label: 'Charset',
          elements: [
            {
              type: 'HorizontalLayout',
              elements: [
                {
                  type: 'Control',
                  label: 'Shared',
                  scope: '#/properties/tileset/properties/shared'
                },
                {
                  type: 'Control',
                  label: 'Reduction',
                  scope: '#/properties/tileset/properties/reduce'
                },
                {
                  type: 'Control',
                  label: 'Compression',
                  scope: '#/properties/tileset/properties/compress'
                }
              ]
            }
          ]
        },
        {
          type: 'Group',
          label: 'Map',
          elements: [
            {
              type: 'Control',
              label: 'Generate',
              scope: '#/properties/map/properties/generate'
            },
            {
              type: 'HorizontalLayout',
              rule: {
                effect: 'HIDE',
                condition: {
                  scope: '#/properties/map/properties/generate',
                  schema: {
                    const: false
                  }
                }
              },
              elements: [
                {
                  type: 'Control',
                  label: 'Reduce Flipped',
                  scope: '#/properties/map/properties/reduce/properties/flipped'
                },
                {
                  type: 'Control',
                  label: 'Reduce Unique',
                  scope: '#/properties/map/properties/reduce/properties/unique'
                }
              ]
            },
          ]
        },
        {
          type: 'Group',
          label: 'Animation',
          elements: [
            {
              type: 'Control',
              label: 'Is Animation',
              scope: '#/properties/animation/properties/isAnimation'
            },
            {
              type: 'VerticalLayout',
              rule: {
                effect: 'HIDE',
                condition: {
                  scope: '#/properties/animation/properties/isAnimation',
                  schema: {
                    const: false
                  }
                }
              },
              elements: [
                {
                  type: 'Control',
                  label: 'Frames are individual images',
                  scope: '#/properties/animation/properties/individualFiles'
                },
                {
                  type: 'HorizontalLayout',
                  rule: {
                    effect: 'HIDE',
                    condition: {
                      scope: '#/properties/animation/properties/individualFiles',
                      schema: {
                        const: true
                      }
                    }
                  },
                  elements: [
                    {
                      type: 'Control',
                      label: 'Width',
                      scope: '#/properties/animation/properties/frameWidth'
                    },
                    {
                      type: 'Control',
                      label: 'Height',
                      scope: '#/properties/animation/properties/frameWidth'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  },
  Project: {
    schema: {
      title: 'Project',
      properties: {
        typeId: {
          const: 'Project'
        },
        name: {
          type: 'string',
          default: 'VUEngine Project'
        },
        author: {
          type: 'string'
        },
        description: {
          type: 'string'
        }
      },
      required: [
        'name'
      ],
      additionalProperties: false
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          label: 'Project Name',
          scope: '#/properties/name'
        },
        {
          type: 'Control',
          label: 'Author(s)',
          scope: '#/properties/author'
        },
        {
          type: 'Control',
          label: 'Description',
          scope: '#/properties/description'
        }
      ]
    },
    children: {
      Font: {
        RomHeader: false
      }
    },
    icon: 'fa fa-cog'
  },
  RomHeader: {
    schema: {
      title: 'ROM Header',
      properties: {
        typeId: {
          const: 'RomHeader'
        },
        gameTitle: {
          type: 'string',
          minLength: 0,
          maxLength: 20,
          default: 'VUENGINE PROJECT'
        },
        gameCodeSystem: {
          type: 'string',
          minLength: 1,
          maxLength: 1,
          default: 'V'
        },
        gameCodeId: {
          type: 'string',
          minLength: 2,
          maxLength: 2,
          default: 'VU'
        },
        gameCodeLanguage: {
          type: 'string',
          minLength: 1,
          maxLength: 1,
          default: 'E'
        },
        makerCode: {
          type: 'string',
          minLength: 2,
          maxLength: 2
        },
        revision: {
          type: 'integer',
          maximum: 9,
          minimum: 0,
          default: 0
        }
      },
      required: [
        'gameTitle',
        'gameCodeSystem',
        'gameCodeId',
        'gameCodeLanguage',
        'makerCode',
        'revision'
      ],
      additionalProperties: false
    },
    uiSchema: {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          label: 'Game Title',
          scope: '#/properties/gameTitle'
        },
        {
          type: 'Group',
          label: 'Game Code',
          elements: [
            {
              type: 'HorizontalLayout',
              elements: [
                {
                  type: 'Control',
                  label: 'System',
                  scope: '#/properties/gameCodeSystem'
                },
                {
                  type: 'Control',
                  label: 'ID',
                  scope: '#/properties/gameCodeId'
                },
                {
                  type: 'Control',
                  label: 'Language',
                  scope: '#/properties/gameCodeLanguage'
                }
              ]
            },
          ],
        },
        {
          type: 'Control',
          label: 'Maker Code',
          scope: '#/properties/makerCode'
        },
        {
          type: 'Control',
          label: 'Revision',
          scope: '#/properties/revision'
        }
      ]
    },
    icon: 'fa fa-microchip'
  },
};
