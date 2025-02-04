'use strict';

const Interaction = require('./Interaction');
const Message = require('./Message');
const Member = require('./Member');
const { InteractionResponseTypes } = require('../Constants');

/**
 * Represents a message component interaction. See Interaction for more properties.
 * @extends Interaction
 * @prop {PrivateChannel | TextChannel | NewsChannel} channel The channel the interaction was created in. Can be partial with only the id if the channel is not cached.
 * @prop {Object} data The data attached to the interaction
 * @prop {Number} data.component_type The type of Message Component
 * @prop {String} data.custom_id The ID of the Message Component
 * @prop {Array<String>?} data.values The value of the run selected options (Select Menus Only)
 * @prop {String?} guildID The ID of the guild in which the interaction was created
 * @prop {Member?} member The member who triggered the interaction (This is only sent when the interaction is invoked within a guild)
 * @prop {Message?} message The message the interaction came from.
 * @prop {User?} user The user who triggered the interaction (This is only sent when the interaction is invoked within a dm)
 */
class ComponentInteraction extends Interaction {
  constructor(info, client) {
    super(info, client);

    this.channel = this._client.getChannel(info.channel_id) || {
      id: info.channel_id
    };

    this.data = info.data;

    if (info.guild_id !== undefined) {
      this.guildID = info.guild_id;
    }

    if (info.member !== undefined) {
      if (this.channel.guild) {
        info.member.id = info.member.user.id;
        this.member = this.channel.guild.members.update(info.member, this.channel.guild);
      } else {
        const guild = this._client.guilds.get(info.guild_id);
        this.member = new Member(info.member, guild, this._client);
      }
    }

    if (info.message !== undefined) {
      this.message = new Message(info.message, this._client);
    }

    if (info.user !== undefined) {
      this.user = this._client.users.update(info.user, client);
    }
  }

  /**
   * Acknowledges the interaction with a defer message update response
   * @returns {Promise}
   */
  async acknowledge() {
    return this.deferUpdate();
  }

  /**
   * Respond to the interaction with a followup message
   * @arg {String | Object} content A string or object. If an object is passed:
   * @arg {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
   * @arg {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here.
   * @arg {Boolean | Array<String>} [content.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow.
   * @arg {Boolean | Array<String>} [content.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow.
   * @arg {Array<Object>} [content.components] An array of component objects
   * @arg {String} [content.components[].custom_id] The ID of the component (type 2 style 0-4 and type 3 only)
   * @arg {Boolean} [content.components[].disabled] Whether the component is disabled (type 2 and 3 only)
   * @arg {Object} [content.components[].emoji] The emoji to be displayed in the component (type 2)
   * @arg {String} [content.components[].label] The label to be displayed in the component (type 2)
   * @arg {Number} [content.components[].max_values] The maximum number of items that can be chosen (1-25, default 1)
   * @arg {Number} [content.components[].min_values] The minimum number of items that must be chosen (0-25, default 1)
   * @arg {Array<Object>} [content.components[].options] The options for this component (type 3 only)
   * @arg {Boolean} [content.components[].options[].default] Whether this option should be the default value selected
   * @arg {String} [content.components[].options[].description] The description for this option
   * @arg {Object} [content.components[].options[].emoji] The emoji to be displayed in this option
   * @arg {String} content.components[].options[].label The label for this option
   * @arg {Number | String} content.components[].options[].value The value for this option
   * @arg {String} [content.components[].placeholder] The placeholder text for the component when no option is selected (type 3 only)
   * @arg {Number} [content.components[].style] The style of the component (type 2 only) - If 0-4, `custom_id` is required; if 5, `url` is required
   * @arg {Number} content.components[].type The type of component - If 1, it is a collection and a `components` array (nested) is required; if 2, it is a button; if 3, it is a select menu
   * @arg {String} [content.components[].url] The URL that the component should open for users (type 2 style 5 only)
   * @arg {String} content.content A content string
   * @arg {Object} [content.embeds] An array of up to 10 embed objects. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
   * @arg {Number} [content.flags] 64 for Ephemeral
   * @arg {Object | Array<Object>} [content.file] A file object (or an Array of them)
   * @arg {Buffer} content.file.file A buffer containing file data
   * @arg {String} content.file.name What to name the file
   * @arg {Boolean} [content.tts] Set the message TTS flag
   * @returns {Promise<Message?>}
   */
  async createFollowup(content) {
    if (this.acknowledged === false) {
      throw new Error(
        'createFollowup cannot be used to acknowledge an interaction, please use acknowledge, createMessage, defer, deferUpdate, or editParent first.'
      );
    }
    if (content !== undefined) {
      if (typeof content !== 'object' || content === null) {
        content = {
          content: '' + content
        };
      } else if (content.content !== undefined && typeof content.content !== 'string') {
        content.content = '' + content.content;
      }
    }
    return this._client.executeWebhook.call(
      this._client,
      this.applicationID,
      this.token,
      Object.assign({ wait: true }, content)
    );
  }

  /**
   * Acknowledges the interaction with a message. If already acknowledged runs createFollowup
   * Note: You can **not** use more than 1 initial interaction response per interaction, use createFollowup if you have already responded with a different interaction response.
   * @arg {String | Object} content A string or object. If an object is passed:
   * @arg {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
   * @arg {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here.
   * @arg {Boolean | Array<String>} [content.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow.
   * @arg {Boolean | Array<String>} [content.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow.
   * @arg {Array<Object>} [content.components] An array of component objects
   * @arg {String} [content.components[].custom_id] The ID of the component (type 2 style 0-4 and type 3 only)
   * @arg {Boolean} [content.components[].disabled] Whether the component is disabled (type 2 and 3 only)
   * @arg {Object} [content.components[].emoji] The emoji to be displayed in the component (type 2)
   * @arg {String} [content.components[].label] The label to be displayed in the component (type 2)
   * @arg {Number} [content.components[].max_values] The maximum number of items that can be chosen (1-25, default 1)
   * @arg {Number} [content.components[].min_values] The minimum number of items that must be chosen (0-25, default 1)
   * @arg {Array<Object>} [content.components[].options] The options for this component (type 3 only)
   * @arg {Boolean} [content.components[].options[].default] Whether this option should be the default value selected
   * @arg {String} [content.components[].options[].description] The description for this option
   * @arg {Object} [content.components[].options[].emoji] The emoji to be displayed in this option
   * @arg {String} content.components[].options[].label The label for this option
   * @arg {Number | String} content.components[].options[].value The value for this option
   * @arg {String} [content.components[].placeholder] The placeholder text for the component when no option is selected (type 3 only)
   * @arg {Number} [content.components[].style] The style of the component (type 2 only) - If 0-4, `custom_id` is required; if 5, `url` is required
   * @arg {Number} content.components[].type The type of component - If 1, it is a collection and a `components` array (nested) is required; if 2, it is a button; if 3, it is a select menu
   * @arg {String} [content.components[].url] The URL that the component should open for users (type 2 style 5 only)
   * @arg {String} content.content A content string
   * @arg {Object} [content.embeds] An array of up to 10 embed objects. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
   * @arg {Number} [content.flags] 64 for Ephemeral
   * @arg {Object | Array<Object>} [content.file] A file object (or an Array of them)
   * @arg {Buffer} content.file.file A buffer containing file data
   * @arg {String} content.file.name What to name the file
   * @arg {Boolean} [content.tts] Set the message TTS flag
   * @returns {Promise}
   */
  async createMessage(content) {
    if (this.acknowledged === true) {
      return this.createFollowup(content);
    }
    if (content !== undefined) {
      if (typeof content !== 'object' || content === null) {
        content = {
          content: '' + content
        };
      } else if (content.content !== undefined && typeof content.content !== 'string') {
        content.content = '' + content.content;
      } else if (content.content === undefined && !content.embeds) {
        return Promise.reject(new Error('No content or embeds'));
      }
      if (content.content !== undefined || content.embeds || content.allowedMentions) {
        content.allowed_mentions = this._client._formatAllowedMentions(content.allowedMentions);
      }
    }
    return this._client.createInteractionResponse
      .call(
        this._client,
        this.id,
        this.token,
        {
          type: InteractionResponseTypes.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: content.content,
            embeds: content.embeds,
            tts: content.tts,
            flags: content.flags,
            allowed_mentions: content.allowed_mentions,
            components: content.components
          }
        },
        content.file
      )
      .then(() => this.update());
  }

  /**
   * Acknowledges the interaction with a defer response
   * Note: You can **not** use more than 1 initial interaction response per interaction.
   * @arg {Number} [flags] 64 for Ephemeral
   * @returns {Promise}
   */
  async defer(flags) {
    if (this.acknowledged === true) {
      throw new Error('You have already acknowledged this interaction.');
    }
    return this._client.createInteractionResponse
      .call(this._client, this.id, this.token, {
        type: InteractionResponseTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: flags || 0
        }
      })
      .then(() => this.update());
  }

  /**
   * Acknowledges the interaction with a defer message update response
   * Note: You can **not** use more than 1 initial interaction response per interaction.
   * @returns {Promise}
   */
  async deferUpdate() {
    if (this.acknowledged === true) {
      throw new Error('You have already acknowledged this interaction.');
    }
    return this._client.createInteractionResponse
      .call(this._client, this.id, this.token, {
        type: InteractionResponseTypes.DEFERRED_UPDATE_MESSAGE
      })
      .then(() => this.update());
  }

  /**
   * Delete a message
   * @arg {String} messageID the id of the message to delete, or "@original" for the original response.
   * @returns {Promise}
   */
  async deleteMessage(messageID) {
    if (this.acknowledged === false) {
      throw new Error(
        'deleteMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, defer, deferUpdate, or editParent first.'
      );
    }
    return this._client.deleteWebhookMessage.call(this._client, this.applicationID, this.token, messageID);
  }

  /**
   * Delete the parent message
   * Warning: Will error with ephemeral messages.
   * @returns {Promise}
   */
  async deleteOriginalMessage() {
    if (this.acknowledged === false) {
      throw new Error(
        'deleteOriginalMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, defer, deferUpdate, or editParent first.'
      );
    }
    return this._client.deleteWebhookMessage.call(this._client, this.applicationID, this.token, '@original');
  }

  /**
   * Edit a message
   * @arg {String} messageID the id of the message to edit, or "@original" for the original response.
   * @arg {Object} options Interaction message edit options
   * @arg {Object} [options.allowedMentions] A list of mentions to allow (overrides default)
   * @arg {Boolean} [options.allowedMentions.everyone] Whether or not to allow @everyone/@here.
   * @arg {Boolean | Array<String>} [options.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow.
   * @arg {Boolean | Array<String>} [options.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow.
   * @arg {Boolean} [options.allowedMentions.repliedUser] Whether or not to mention the author of the message being replied to.
   * @arg {Array<Object>} [content.components] An array of component objects
   * @arg {String} [content.components[].custom_id] The ID of the component (type 2 style 0-4 and type 3 only)
   * @arg {Boolean} [content.components[].disabled] Whether the component is disabled (type 2 and 3 only)
   * @arg {Object} [content.components[].emoji] The emoji to be displayed in the component (type 2)
   * @arg {String} [content.components[].label] The label to be displayed in the component (type 2)
   * @arg {Number} [content.components[].max_values] The maximum number of items that can be chosen (1-25, default 1)
   * @arg {Number} [content.components[].min_values] The minimum number of items that must be chosen (0-25, default 1)
   * @arg {Array<Object>} [content.components[].options] The options for this component (type 3 only)
   * @arg {Boolean} [content.components[].options[].default] Whether this option should be the default value selected
   * @arg {String} [content.components[].options[].description] The description for this option
   * @arg {Object} [content.components[].options[].emoji] The emoji to be displayed in this option
   * @arg {String} content.components[].options[].label The label for this option
   * @arg {Number | String} content.components[].options[].value The value for this option
   * @arg {String} [content.components[].placeholder] The placeholder text for the component when no option is selected (type 3 only)
   * @arg {Number} [content.components[].style] The style of the component (type 2 only) - If 0-4, `custom_id` is required; if 5, `url` is required
   * @arg {Number} content.components[].type The type of component - If 1, it is a collection and a `components` array (nested) is required; if 2, it is a button; if 3, it is a select menu
   * @arg {String} [content.components[].url] The URL that the component should open for users (type 2 style 5 only)
   * @arg {String} [options.content=""] A content string
   * @arg {Object} [content.embeds] An array of up to 10 embed objects. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
   * @arg {Object | Array<Object>} [options.file] A file object (or an Array of them)
   * @arg {Buffer} options.file.file A buffer containing file data
   * @arg {String} options.file.name What to name the file
   * @returns {Promise<Message>}
   */
  async editMessage(messageID, content) {
    if (this.acknowledged === false) {
      throw new Error(
        'editMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, defer, deferUpdate, or editParent first.'
      );
    }
    if (content !== undefined) {
      if (typeof content !== 'object' || content === null) {
        content = {
          content: '' + content
        };
      } else if (content.content !== undefined && typeof content.content !== 'string') {
        content.content = '' + content.content;
      }
    }
    return this._client.editWebhookMessage.call(this._client, this.applicationID, this.token, messageID, content);
  }

  /**
   * Edit the parent message
   * @arg {Object} options Interaction message edit options
   * @arg {Object} [options.allowedMentions] A list of mentions to allow (overrides default)
   * @arg {Boolean} [options.allowedMentions.everyone] Whether or not to allow @everyone/@here.
   * @arg {Boolean | Array<String>} [options.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow.
   * @arg {Boolean | Array<String>} [options.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow.
   * @arg {Boolean} [options.allowedMentions.repliedUser] Whether or not to mention the author of the message being replied to.
   * @arg {Array<Object>} [content.components] An array of component objects
   * @arg {String} [content.components[].custom_id] The ID of the component (type 2 style 0-4 and type 3 only)
   * @arg {Boolean} [content.components[].disabled] Whether the component is disabled (type 2 and 3 only)
   * @arg {Object} [content.components[].emoji] The emoji to be displayed in the component (type 2)
   * @arg {String} [content.components[].label] The label to be displayed in the component (type 2)
   * @arg {Number} [content.components[].max_values] The maximum number of items that can be chosen (1-25, default 1)
   * @arg {Number} [content.components[].min_values] The minimum number of items that must be chosen (0-25, default 1)
   * @arg {Array<Object>} [content.components[].options] The options for this component (type 3 only)
   * @arg {Boolean} [content.components[].options[].default] Whether this option should be the default value selected
   * @arg {String} [content.components[].options[].description] The description for this option
   * @arg {Object} [content.components[].options[].emoji] The emoji to be displayed in this option
   * @arg {String} content.components[].options[].label The label for this option
   * @arg {Number | String} content.components[].options[].value The value for this option
   * @arg {String} [content.components[].placeholder] The placeholder text for the component when no option is selected (type 3 only)
   * @arg {Number} [content.components[].style] The style of the component (type 2 only) - If 0-4, `custom_id` is required; if 5, `url` is required
   * @arg {Number} content.components[].type The type of component - If 1, it is a collection and a `components` array (nested) is required; if 2, it is a button; if 3, it is a select menu
   * @arg {String} [content.components[].url] The URL that the component should open for users (type 2 style 5 only)
   * @arg {String} [options.content=""] A content string
   * @arg {Object} [content.embeds] An array of up to 10 embed objects. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
   * @arg {Object | Array<Object>} [options.file] A file object (or an Array of them)
   * @arg {Buffer} options.file.file A buffer containing file data
   * @arg {String} options.file.name What to name the file
   * @returns {Promise<Message>}
   */
  async editOriginalMessage(content) {
    if (this.acknowledged === false) {
      throw new Error(
        'editOriginalMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, defer, deferUpdate, or editParent first.'
      );
    }
    if (content !== undefined) {
      if (typeof content !== 'object' || content === null) {
        content = {
          content: '' + content
        };
      } else if (content.content !== undefined && typeof content.content !== 'string') {
        content.content = '' + content.content;
      }
    }
    return this._client.editWebhookMessage.call(this._client, this.applicationID, this.token, '@original', content);
  }

  /**
   * Acknowledges the interaction by editing the parent message. If already acknowledged runs editOriginalMessage
   * Note: You can **not** use more than 1 initial interaction response per interaction, use edit if you have already responded with a different interaction response.
   * Warning: Will error with ephemeral messages.
   * @arg {String | Object} content What to edit the message with
   * @arg {Object} [content.allowedMentions] A list of mentions to allow (overrides default)
   * @arg {Boolean} [content.allowedMentions.everyone] Whether or not to allow @everyone/@here.
   * @arg {Boolean | Array<String>} [content.allowedMentions.roles] Whether or not to allow all role mentions, or an array of specific role mentions to allow.
   * @arg {Boolean | Array<String>} [content.allowedMentions.users] Whether or not to allow all user mentions, or an array of specific user mentions to allow.
   * @arg {Boolean} [content.allowedMentions.repliedUser] Whether or not to mention the author of the message being replied to.
   * @arg {Array<Object>} [content.components] An array of component objects
   * @arg {String} [content.components[].custom_id] The ID of the component (type 2 style 0-4 and type 3 only)
   * @arg {Boolean} [content.components[].disabled] Whether the component is disabled (type 2 and 3 only)
   * @arg {Object} [content.components[].emoji] The emoji to be displayed in the component (type 2)
   * @arg {String} [content.components[].label] The label to be displayed in the component (type 2)
   * @arg {Number} [content.components[].max_values] The maximum number of items that can be chosen (1-25, default 1)
   * @arg {Number} [content.components[].min_values] The minimum number of items that must be chosen (0-25, default 1)
   * @arg {Array<Object>} [content.components[].options] The options for this component (type 3 only)
   * @arg {Boolean} [content.components[].options[].default] Whether this option should be the default value selected
   * @arg {String} [content.components[].options[].description] The description for this option
   * @arg {Object} [content.components[].options[].emoji] The emoji to be displayed in this option
   * @arg {String} content.components[].options[].label The label for this option
   * @arg {Number | String} content.components[].options[].value The value for this option
   * @arg {String} [content.components[].placeholder] The placeholder text for the component when no option is selected (type 3 only)
   * @arg {Number} [content.components[].style] The style of the component (type 2 only) - If 0-4, `custom_id` is required; if 5, `url` is required
   * @arg {Number} content.components[].type The type of component - If 1, it is a collection and a `components` array (nested) is required; if 2, it is a button; if 3, it is a select menu
   * @arg {String} [content.components[].url] The URL that the component should open for users (type 2 style 5 only)
   * @arg {String} [content.content=""] A content string
   * @arg {Object} [content.embeds] An array of up to 10 embed objects. See [the official Discord API documentation entry](https://discord.com/developers/docs/resources/channel#embed-object) for object structure
   * @arg {Object | Array<Object>} [content.file] A file object (or an Array of them)
   * @arg {Buffer} content.file.file A buffer containing file data
   * @arg {String} content.file.name What to name the file
   * @returns {Promise}
   */
  async editParent(content) {
    if (this.acknowledged === true) {
      return this.editOriginalMessage(content);
    }
    if (content !== undefined) {
      if (typeof content !== 'object' || content === null) {
        content = {
          content: '' + content
        };
      } else if (content.content !== undefined && typeof content.content !== 'string') {
        content.content = '' + content.content;
      } else if (content.content === undefined && content.embeds === undefined && content.components === undefined) {
        return Promise.reject(new Error('No content, embeds, or components'));
      }
      if (content.content !== undefined || content.embeds || content.allowedMentions) {
        content.allowed_mentions = this._client._formatAllowedMentions(content.allowedMentions);
      }
    }
    return this._client.createInteractionResponse
      .call(
        this._client,
        this.id,
        this.token,
        {
          type: InteractionResponseTypes.UPDATE_MESSAGE,
          data: {
            content: content.content,
            embeds: content.embeds,
            tts: content.tts,
            flags: content.flags,
            allowed_mentions: content.allowed_mentions,
            components: content.components
          }
        },
        content.file
      )
      .then(() => this.update());
  }

  /**
   * Get the parent message
   * Warning: Will error with ephemeral messages.
   * @returns {Promise<Message>}
   */
  async getOriginalMessage() {
    if (this.acknowledged === false) {
      throw new Error(
        'getOriginalMessage cannot be used to acknowledge an interaction, please use acknowledge, createMessage, defer, deferUpdate, or editParent first.'
      );
    }
    return this._client.getWebhookMessage.call(this._client, this.applicationID, this.token, '@original');
  }
}

module.exports = ComponentInteraction;
