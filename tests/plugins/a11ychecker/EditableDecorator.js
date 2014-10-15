/* bender-tags: editor,unit */
/* bender-ckeditor-plugins: a11ychecker,toolbar */
/* bender-include: %TEST_DIR%_helpers/require.js, %TEST_DIR%_helpers/requireConfig.js */

( function() {
	'use strict';

	require( [ 'EditableDecorator', 'Controller', 'mock/EditableDecoratorMockup', 'mock/IssueListMockup', 'IssueList', 'helpers/sinon/sinon_amd.min' ], function( EditableDecorator, Controller, EditableDecoratorMockup, IssueListMockup, IssueList, sinon ) {
		bender.test( {

			setUp: function() {
				this.mockup = new EditableDecoratorMockup();
				this.mockup.resetContent();
			},

			'test EditableDecorator.editable': function() {
				// We need to mock EditableDecorator and Editor, because decorator
				// asks the editor for the editable.
				var editorMock = {
						// Simply return 1.
						editable: function() {
							return 1;
						}
					},
					decoratorMock = {
						editor: editorMock
					},
					ret;

				ret = EditableDecorator.prototype.editable.call( decoratorMock );

				assert.areSame( 1, ret, 'Invalid return value' );
			},

			'test EditableDecorator.applyMarkup': function() {
				var editable = this.mockup.editable();
				this.mockup.applyMarkup();

				function forceElementEvaluator( el ) {
					return el.type == CKEDITOR.NODE_ELEMENT;
				}

				// We'll pick 3 elements, and examine each one of them.
				var firstChildElement = editable.getFirst( forceElementEvaluator ),
					lastChildElement = editable.getLast( forceElementEvaluator ),
					nestedChildElement = lastChildElement.getLast( forceElementEvaluator );

				assert.isTrue( firstChildElement.hasAttribute( 'data-quail-id' ), 'First element has data-quail-id attr' );
				assert.areSame( '2', firstChildElement.data( 'quail-id' ), 'First element has valid data-quail-id attr value' );

				assert.isTrue( lastChildElement.hasAttribute( 'data-quail-id' ), 'Last element has data-quail-id attr' );
				assert.areSame( '7', lastChildElement.data( 'quail-id' ), 'Last element has valid data-quail-id attr value' );

				assert.isTrue( nestedChildElement.hasAttribute( 'data-quail-id' ), 'Nested element has data-quail-id attr' );
				assert.areSame( '8', nestedChildElement.data( 'quail-id' ), 'Nested element has valid data-quail-id attr value' );
			},

			'test EditableDecorator.removeMarkup': function() {
				var editable = this.mockup.editable();

				this.mockup.loadContentFrom( 'a11ycheckerIdMarkup' );
				this.mockup.removeMarkup();

				editable.forEach( function( elem ) {
					// Checks each element for the attribute.
					assert.isFalse( elem.hasAttribute( 'data-quail-id' ),
						'Element stil has data-quail-id attr. Element outer: ' + elem.getOuterHtml() );
				}, CKEDITOR.NODE_ELEMENT );
			},

			'test EditableDecorator.removeMarkup removing .cke_a11ychecker_issue': function() {
				// EditableDecorator.removeMarkup should also remove cke_a11ychecker_issue class.
				var editable = this.mockup.editable();

				this.mockup.loadContentFrom( 'a11ycheckerIdMarkup' );
				this.mockup.removeMarkup();

				assert.areSame( 0, editable.find( '.cke_a11ychecker_issue' ).count(),
					'No .cke_a11ychecker_issue elmeents are found' );
			},

			'test EditableDecorator.markIssues': function() {
				// This method should apply cke_a11ychecker_issue class to each
				// issue element (in editable) within given IssueList.

				// Setup the mocked IssueList.
				var issueListMockup = new IssueList(),
					// Only following elements should have HTML class added.
					testedElements = [
						this.mockup.editable().findOne( 'p' ),
						this.mockup.editable().findOne( 'img' )
					],
					className = 'cke_a11ychecker_issue';

				issueListMockup.addItem( {
					element: testedElements[ 0 ],
					isIgnored: sinon.spy()
				} );
				issueListMockup.addItem( {
					element: testedElements[ 1 ],
					isIgnored: sinon.spy()
				} );

				this.mockup.markIssues( issueListMockup );

				for ( var i = 0; i < testedElements.length; i++ ) {
					assert.isTrue( testedElements[ i ].hasClass( className ),
						'testedElements[ ' + i + ' ] has class ' + className );
				}

				assert.areSame( 2, this.mockup.editable().find( '.' + className ).count(),
					'Elements with ' + className + ' count' );
			},

			'test EditableDecorator.markIssues testability': function() {
				// We need to check if markIssues() considers issue.testability,
				// and adds proper data-cke-* attribute.
				var elementMockup = {
						addClass: sinon.spy(),
						data: sinon.spy()
					},
					list = {
						getItem: function() {
							return {
								element: elementMockup,
								// lets use a dummy value, just to make sure that it's passed
								// "as it is".
								testability: 7,
								isIgnored: sinon.spy()
							};
						},
						count: function() {
							return 1;
						}
					};

				// Setup the mocked IssueList.
				this.mockup.markIssues( list );

				assert.areEqual( 1, elementMockup.data.callCount, 'element.data call count' );
				sinon.assert.alwaysCalledWith( elementMockup.data, 'cke-testability', 7 );
			},

			'test EditableDecorator.markIssues applies ignore class': function() {
				// We need to check if markIssues() considers issue.isIgnored(), that should
				// result with editableDecorator.markIgnoredIssue being called.
				var issueMockup = {
						element: {
							addClass: sinon.spy(),
							data: sinon.spy()
						},
						// lets use a dummy value, just to make sure that it's passed
						// "as it is".
						testability: 1,
						isIgnored: sinon.spy( function() {
							return true;
						} )
					},
					list = {
						getItem: function() {
							return issueMockup;
						},
						count: function() {
							return 1;
						}
					};

				this.mockup.markIgnoredIssue = sinon.spy();

				// Setup the mocked IssueList.
				this.mockup.markIssues( list );

				assert.areSame( 1, this.mockup.markIgnoredIssue.callCount,
					'editableDecorator.markIgnoredIssue call count' );
			},

			'test EditableDecorator.removeMarkup cke_a11ychecker_issue': function() {
				var editable = this.mockup.editable();

				this.mockup.loadContentFrom( 'a11ycheckerIdMarkup' );
				this.mockup.removeMarkup();

				editable.forEach( function( elem ) {
					// Checks each element for the attribute.
					assert.isFalse( elem.hasAttribute( 'data-quail-id' ),
						'Element stil has data-quail-id attr. Element outer: ' + elem.getOuterHtml() );
				}, CKEDITOR.NODE_ELEMENT );
			},

			'test EditableDecorator.resolveEditorElements': function() {
				// Setup the mocked IssueList.
				var issueListMockup = new IssueList();
				issueListMockup.addItem( {
					originalElement: CKEDITOR.dom.element.createFromHtml( '<p data-quail-id="2"></p>' )
				} );
				issueListMockup.addItem( {
					originalElement: CKEDITOR.dom.element.createFromHtml( '<p data-quail-id="5"></p>' )
				} );

				// Load content with data-quail-id attributes, and call tested method.
				this.mockup.loadContentFrom( 'a11ycheckerIdMarkup' );
				this.mockup.resolveEditorElements( issueListMockup );

				// Set expected elements (the ones with matching data-quail-id attr).
				var expectedElements = [
					this.mockup.editable().findOne( 'p' ),
					this.mockup.editable().findOne( 'img' )
				];

				for ( var i = 0; i < expectedElements.length; i++ ) {
					assert.isInstanceOf( CKEDITOR.dom.element, issueListMockup.list[ i ].element,
						'Invalid in issueListMockup.list[ ' + i + ' ]' );
					assert.areSame( expectedElements[ i ], issueListMockup.list[ i ].element,
						'Invalid element at offset ' + i );
				}
			},

			'test clickListener': function() {
				patchMockupForClick( this.mockup );

				var showIssueByElementMock = this.mockup.editor._.a11ychecker.showIssueByElement,
					element = CKEDITOR.document.getById( 'nestedIssue' ).$,
					evtMock = new CKEDITOR.dom.event( {
						target: element
					} );

				this.mockup.clickListener( { data: evtMock } );

				assert.areSame( 1, showIssueByElementMock.callCount, 'Controller.showIssueByElement calls count' );
				assert.areSame( element, showIssueByElementMock.args[ 0 ][ 0 ].$ );
			},

			'test clickListener nested': function() {
				// This time function will be called on element nested within
				// element marked as a11y issue.
				patchMockupForClick( this.mockup );

				var showIssueByElementMock = this.mockup.editor._.a11ychecker.showIssueByElement,
					// A parent, which is marked with cke_a11ychecker_issue class.
					issueElement = CKEDITOR.document.findOne( '#fakeErrors .cke_a11ychecker_issue' ),
					// A nested element, which doesnt have a error class, but will receive click event.
					element = issueElement.findOne( 'p' ).$,
					evtMock = new CKEDITOR.dom.event( {
						target: element
					} );

				this.mockup.clickListener( { data: evtMock } );

				assert.areSame( 1, showIssueByElementMock.callCount, 'Controller.showIssueByElement calls count' );
				assert.areSame( issueElement, showIssueByElementMock.args[ 0 ][ 0 ] );
			},

			'test clickListener invalid': function() {
				// Lets call standard element, which is not marked as an a11y issue, nor
				// it has parents marked as issued.
				patchMockupForClick( this.mockup );

				var showIssueByElementMock = this.mockup.editor._.a11ychecker.showIssueByElement,
					element = CKEDITOR.dom.element.createFromHtml( '<div></div>' ).$,
					evtMock = new CKEDITOR.dom.event( {
						target: element
					} );

				this.mockup.clickListener( { data: evtMock } );

				assert.areSame( 0, showIssueByElementMock.callCount, 'Controller.showIssueByElement calls count' );
			},

			'test clickListener focused': function() {
				// Lets click already focused issue. This should switch Controller into listening mode.
				patchMockupForClick( this.mockup );

				var setModeMock = this.mockup.editor._.a11ychecker.setMode,
					showIssueByElementMock = this.mockup.editor._.a11ychecker.showIssueByElement,
					element = CKEDITOR.document.findOne( '#fakeErrors .cke_a11y_focused' ).$,
					evtMock = new CKEDITOR.dom.event( {
						target: element
					} );

				this.mockup.clickListener( { data: evtMock } );

				assert.areSame( 1, setModeMock.callCount,
					'Controller.setMode calls count' );
				assert.areEqual( Controller.modes.LISTENING, setModeMock.args[ 0 ][ 0 ],
					'Controller.setMode first argument' );
				assert.areEqual( 0, showIssueByElementMock.callCount,
					'Controlelr.showIssueByElement call count' );
			},

			'test markIgnoredIssue': function() {
				var issue = {
					isIgnored: function() {
						return true;
					},
					element: {
						addClass: sinon.spy()
					}
				};

				this.mockup.markIgnoredIssue( issue );

				assert.areSame( 1, issue.element.addClass.callCount, 'element.addClass call count' );
				sinon.assert.alwaysCalledWith( issue.element.addClass, 'cke_a11ychecker_ignored' );
			},

			'test markIgnoredIssue not ignored element': function() {
				// Ensure that element class cke_a11ychecker_ignored is removed when issue is not
				// ignored.
				var issue = {
					isIgnored: function() {
						return false;
					},
					element: {
						removeClass: sinon.spy()
					}
				};

				this.mockup.markIgnoredIssue( issue );

				assert.areSame( 1, issue.element.removeClass.callCount, 'element.removeClass call count' );
				sinon.assert.alwaysCalledWith( issue.element.removeClass, 'cke_a11ychecker_ignored' );
			}
		} );

		// Patches mockup so it can work with clickListener function.
		function patchMockupForClick( editableDecoratorMockup ) {
			editableDecoratorMockup.editor = {
				_: {
					a11ychecker: {
						showIssueByElement: sinon.spy(),
						setMode: sinon.spy()
					}
				}
			};
		}
	} );
} )();