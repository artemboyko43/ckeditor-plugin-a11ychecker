
( function() {
	'use strict';

	CKEDITOR.plugins.a11ychecker.quickFixes.get( {
		name: 'ElementReplace',
		callback: function( ElementReplace ) {
			/**
			 * Replaces provided element with element that a different tag name, preserving its children.
			 *
			 * @member CKEDITOR.plugins.a11ychecker.quickFix
			 * @class ParagraphToHeader
			 * @constructor
			 * @param {CKEDITOR.plugins.a11ychecker.Issue} issue
			 */
			function ParagraphToHeader( issue ) {
				ElementReplace.call( this, issue );
			}

			ParagraphToHeader.prototype = new ElementReplace();
			ParagraphToHeader.prototype.constructor = ParagraphToHeader;

			/**
			 * Returns the name of the tag that issue.element should be converted to.
			 *
			 * @member CKEDITOR.plugins.a11ychecker.quickFix.ParagraphToHeader
			 * @returns {String}
			 */
			ParagraphToHeader.prototype.getTargetName = function() {
				return 'h1';
			};

			ParagraphToHeader.prototype.display = function( form ) {
				form.setInputs( {
					level: {
						type: 'text',
						label: this.lang.levelLabel,
						value: 'h2'
					}
				} );
			};

			ParagraphToHeader.prototype.fix = function( formAttributes, callback ) {
				var newElement = new CKEDITOR.dom.element( this.getTargetName() ),
					parent = this.issue.element.getParent();

				this.issue.element.remove();
				this.issue.element.moveChildren( newElement );

				parent.append( newElement );

				if ( callback ) {
					callback( this );
				}
			};

			/**
			 * Determines preferred heading level for the header that should be cerated.
			 *
			 * @private
			 * @param {CKEDITOR.editor} editor
			 * @returns {Number} Number ranging from `1` to `6`.
			 */
			ParagraphToHeader.prototype._getPreferredLevel = function( editor ) {
				var ret = 1,
					editable = editor.editable(),
					headerTagRegExp = /^h[1-6]$/i,
					range = new CKEDITOR.dom.range( editable.getDocument() ),
					walker,
					prevElement;

				range.setStartAt( editable, CKEDITOR.POSITION_AFTER_START );
				range.setEndAt( this.issue.element, CKEDITOR.POSITION_BEFORE_START );
				walker = new CKEDITOR.dom.walker( range );

				while ( ( prevElement = walker.previous() ) ) {
					if ( prevElement.getName && prevElement.getName().match( headerTagRegExp ) ) {
						ret = Number( prevElement.getName()[ 1 ] ) + 1;
						break;
					}
				}

				// WE can't return a higher value than 7.
				return Math.min( ret, 6 );
			};

			/**
			 * Returns minimal and maximal possible header levels for given editor.
			 *
			 * Result will be based on ACF and `config.format_tags`.
			 *
			 * @param {CKEDITOR.editor}
			 * @return {Object} Allowed header level boundaries.
			 * @return {Number} return.min Minimal allowed level.
			 * @return {Number} return.email Maximal allowed level.
			 */
			ParagraphToHeader.prototype._getPossibleLevels = function( editor ) {
				var tags = editor.config.format_tags.split( ';' ),
					ret = {
						min: 1,
						max: 6
					},
					i;

				// Filtering tags.
				for ( i = tags.length - 1; i >= 0; i-- ) {
					// If given tag is not header tag or if it's not allowed by the ACF.
					if ( !tags[ i ].match( /^h[1-6]$/i ) || !editor.filter.check( tags[ i ] ) ) {
						tags.splice( i, 1 );
					} else {
						tags[ i ] = Number( tags[ i ][ 1 ] );
					}
				}

				if ( tags.length ) {
					// Note if IE8 has to be supported we need to inline sorting here.
					tags.sort();

					ret.min = tags[ 0 ];
					ret.max = tags[ tags.length - 1 ];
				}

				return ret;
			};

			CKEDITOR.plugins.a11ychecker.quickFixes.add( 'ParagraphToHeader', ParagraphToHeader );
		}
	} );
}() );