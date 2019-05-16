"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const electron_1 = require("electron");
const request_handler_1 = require("./request-handler");
const util_1 = require("../../util");
const should_scroll_sync_1 = require("./should-scroll-sync");
class RemoteEditorServer {
    constructor(editor) {
        this.editor = editor;
        this.disposables = new atom_1.CompositeDisposable();
        this.windowId = electron_1.remote.getCurrentWindow().id;
        this.destroyTimeoutLength = 60000;
        this.usageCounter = 0;
        this.eventHandlers = {
            scrollToBufferRange: ([min, max]) => {
                if (min === 0) {
                    this.editor.scrollToBufferPosition([min, 0]);
                }
                else if (max >= this.editor.getLastBufferRow() - 1) {
                    this.editor.scrollToBufferPosition([max, 0]);
                }
                else {
                    const range = atom_1.Range.fromObject([[min, 0], [max, 0]]);
                    this.editor.scrollToScreenRange(this.editor.screenRangeForBufferRange(range), {
                        center: false,
                    });
                }
            },
            destroy: () => {
                this.usageCounter -= 1;
                if (this.usageCounter <= 0) {
                    this.resetTimeout();
                    this.destroyTimeout = window.setTimeout(() => {
                        this.destroy();
                    }, this.destroyTimeoutLength);
                }
            },
            init: () => {
                this.usageCounter += 1;
                this.resetTimeout();
                return {
                    path: this.editor.getPath(),
                    title: this.editor.getTitle(),
                    grammar: this.editor.getGrammar().scopeName,
                    text: this.editor.getText(),
                };
            },
            openSource: (row) => {
                if (row !== undefined) {
                    this.editor.setCursorBufferPosition([row, 0]);
                }
                electron_1.remote.getCurrentWindow().focus();
                const pane = atom.workspace.paneForItem(this.editor);
                if (!pane)
                    return;
                pane.activateItem(this.editor);
                pane.activate();
            },
        };
        this.disposables.add(new request_handler_1.RequestHandler(this.windowId, editor.id, this.eventHandlers));
        this.handleEditorEvents();
    }
    static create(editor) {
        const res = RemoteEditorServer.editorMap.get(editor);
        if (res)
            return res;
        const newRes = new RemoteEditorServer(editor);
        RemoteEditorServer.editorMap.set(editor, newRes);
        return newRes;
    }
    destroy() {
        RemoteEditorServer.editorMap.delete(this.editor);
        this.disposables.dispose();
    }
    resetTimeout() {
        if (this.destroyTimeout !== undefined) {
            window.clearTimeout(this.destroyTimeout);
            this.destroyTimeout = undefined;
        }
    }
    handleEditorEvents() {
        this.disposables.add(this.editor.getBuffer().onDidStopChanging(() => {
            if (util_1.atomConfig().previewConfig.liveUpdate) {
                this.emit('changeText', this.editor.getText());
            }
            if (util_1.atomConfig().syncConfig.syncPreviewOnChange) {
                this.emit('syncPreview', {
                    pos: this.editor.getCursorBufferPosition().row,
                    flash: false,
                });
            }
        }), this.editor.onDidChangePath(() => {
            this.emit('changePath', {
                path: this.editor.getPath(),
                title: this.editor.getTitle(),
            });
        }), this.editor.onDidChangeGrammar((grammar) => {
            this.emit('changeGrammar', grammar.scopeName);
        }), this.editor.onDidDestroy(() => {
            this.destroy();
            if (util_1.atomConfig().previewConfig.closePreviewWithEditor) {
                this.emit('destroy', undefined);
            }
        }), this.editor.getBuffer().onDidSave(() => {
            if (!util_1.atomConfig().previewConfig.liveUpdate) {
                this.emit('changeText', this.editor.getText());
            }
        }), this.editor.getBuffer().onDidReload(() => {
            if (!util_1.atomConfig().previewConfig.liveUpdate) {
                this.emit('changeText', this.editor.getText());
            }
        }), atom.views.getView(this.editor).onDidChangeScrollTop(() => {
            if (!should_scroll_sync_1.shouldScrollSync('editor'))
                return;
            const [first, last] = this.editor.getVisibleRowRange();
            const firstLine = this.editor.bufferRowForScreenRow(first);
            const lastLine = this.editor.bufferRowForScreenRow(last);
            this.emit('scrollSync', [firstLine, lastLine]);
        }), atom.commands.add(atom.views.getView(this.editor), {
            'markdown-preview-plus:sync-preview': () => {
                this.emit('syncPreview', {
                    pos: this.editor.getCursorBufferPosition().row,
                    flash: true,
                });
            },
        }));
    }
    emit(event, arg) {
        electron_1.remote.ipcMain.emit('markdown-preview-plus:editor-event', {
            editorId: this.editor.id,
            windowId: this.windowId,
            event,
            arg,
        });
    }
}
RemoteEditorServer.editorMap = new WeakMap();
exports.RemoteEditorServer = RemoteEditorServer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dXAtZWRpdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL21hcmtkb3duLXByZXZpZXctdmlldy9pcGMvc2V0dXAtZWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsK0JBQTZEO0FBQzdELHVDQUFpQztBQUNqQyx1REFBa0Q7QUFDbEQscUNBQXVDO0FBQ3ZDLDZEQUF1RDtBQWtCdkQsTUFBYSxrQkFBa0I7SUFzRDdCLFlBQXFDLE1BQWtCO1FBQWxCLFdBQU0sR0FBTixNQUFNLENBQVk7UUFwRHRDLGdCQUFXLEdBQUcsSUFBSSwwQkFBbUIsRUFBRSxDQUFBO1FBQ3ZDLGFBQVEsR0FBRyxpQkFBTSxDQUFDLGdCQUFnQixFQUFFLENBQUMsRUFBRSxDQUFBO1FBQ3ZDLHlCQUFvQixHQUFHLEtBQUssQ0FBQTtRQUNyQyxpQkFBWSxHQUFHLENBQUMsQ0FBQTtRQUVoQixrQkFBYSxHQUFHO1lBQ3RCLG1CQUFtQixFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFtQixFQUFFLEVBQUU7Z0JBQ3BELElBQUksR0FBRyxLQUFLLENBQUMsRUFBRTtvQkFDYixJQUFJLENBQUMsTUFBTSxDQUFDLHNCQUFzQixDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7aUJBQzdDO3FCQUFNLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDLEVBQUU7b0JBQ3BELElBQUksQ0FBQyxNQUFNLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtpQkFDN0M7cUJBQU07b0JBQ0wsTUFBTSxLQUFLLEdBQUcsWUFBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFDcEQsSUFBSSxDQUFD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SSxDQUFDLENBQUE7WUFDeEQsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQTtRQUNoRCxDQUFDLENBQUMsRUFDRixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDakQsb0NBQW9DLEVBQUUsR0FBRyxFQUFFO2dCQUN6QyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRTtvQkFDdkIsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxHQUFHO29CQUM5QyxLQUFLLEVBQUUsSUFBSTtpQkFDWixDQUFDLENBQUE7WUFDSixDQUFDO1NBQ0YsQ0FBQyxDQUNILENBQUE7SUFDSCxDQUFDO0lBRU8sSUFBSSxDQUE0QixLQUFRLEVBQUUsR0FBaUI7UUFDakUsaUJBQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLG9DQUFvQyxFQUFFO1lBQ3hELFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDeEIsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1lBQ3ZCLEtBQUs7WUFDTCxHQUFHO1NBQ0osQ0FBQyxDQUFBO0lBQ0osQ0FBQzs7QUEvSWMsNEJBQVMsR0FBRyxJQUFJLE9BQU8sRUFBa0MsQ0FBQTtBQUQxRSxnREFpSkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUZXh0RWRpdG9yLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBSYW5nZSB9IGZyb20gJ2F0b20nXG5pbXBvcnQgeyByZW1vdGUgfSBmcm9tICdlbGVjdHJvbidcbmltcG9ydCB7IFJlcXVlc3RIYW5kbGVyIH0gZnJvbSAnLi9yZXF1ZXN0LWhhbmRsZXInXG5pbXBvcnQgeyBhdG9tQ29uZmlnIH0gZnJvbSAnLi4vLi4vdXRpbCdcbmltcG9ydCB7IHNob3VsZFNjcm9sbFN5bmMgfSBmcm9tICcuL3Nob3VsZC1zY3JvbGwtc3luYydcbmltcG9ydCB7IElQQ0V2ZW50cyB9IGZyb20gJy4vZXZlbnQtaGFuZGxlcidcblxuLyogTk9URTogV2VpcmQgcmVmZXJlbmNlIGNvdW50aW5nIGFuZCBXZWFrTWFwIGFyZSBoZXJlIGJlY2F1c2VcbiAqIHRoZXJlIGNhbiBiZSBpbiB0aGVvcnkgbXVsdGlwbGUgd2luZG93cyB3aXRoXG4gKiBNYXJrZG93blByZXZpZXdWaWV3RWRpdG9yUmVtb3RlIHJlZmVyZW5jaW5nIHRoZSBzYW1lXG4gKiBlZGl0b3IgYnkgd2luZG93SWQvZWRpdG9ySWQsIHdoaWNoIHdvdWxkIGxlYWQgdG9cbiAqIG11bHRpcGxlIHRyaWdnZXJzIGlmIG5ldyBcInNlcnZlclwiIHdvdWxkIGJlIGNyZWF0ZWQgZm9yIGV2ZXJ5IG5ld1xuICogcHJldmlldyBpbnN0YW5jZTtcbiAqIFdlaXJkIGRlZmVycmVkIGRpc3Bvc2FsIGlzIGhlcmUgYmVjYXVzZSBuZXctd2luZG93IGV4ZWN1dGVkIG9uXG4gKiBNYXJrZG93blByZXZpZXdWaWV3RWRpdG9yUmVtb3RlIHdpbGwgZmlyc3QgZGVzdHJveSB0aGUgY3VycmVudFxuICogaW5zdGFuY2UsIGFuZCBvbmx5IHRoZW4sIGFmdGVyIGEgbmV3IEF0b20gd2luZG93IGluaXRpYWxpemVzLFxuICogd2lsbCBjcmVhdGUgYSBuZXcgb25lLiBXaGljaCBtaWdodCBlYXNpbHkgdGFrZSB0ZW5zIG9mIHNlY29uZHMuXG4gKiBXaGF0IG1ha2VzIHRoaXMgZXZlbiBtb3JlIGNvbXBsaWNhdGVkLCB0aGVyZSBpcyBubyBzYW5lIHdheSB0b1xuICogY3JlYXRlIGEgbmV3IGluc3RhbmNlIG9mIFJlbW90ZUVkaXRvclNlcnZlciByZW1vdGVseTsgaGVuY2UsXG4gKiBpdCB3YWl0cyBqdXN0IGluIGNhc2UgbmV3IGNsaWVudHMgYXBwZWFyIGJlZm9yZSBkaXNwb3Npbmcgb2YgaXRzZWxmLlxuICovXG5cbmV4cG9ydCBjbGFzcyBSZW1vdGVFZGl0b3JTZXJ2ZXIge1xuICBwcml2YXRlIHN0YXRpYyBlZGl0b3JNYXAgPSBuZXcgV2Vha01hcDxUZXh0RWRpdG9yLCBSZW1vdGVFZGl0b3JTZXJ2ZXI+KClcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgcHJpdmF0ZSByZWFkb25seSB3aW5kb3dJZCA9IHJlbW90ZS5nZXRDdXJyZW50V2luZG93KCkuaWRcbiAgcHJpdmF0ZSByZWFkb25seSBkZXN0cm95VGltZW91dExlbmd0aCA9IDYwMDAwXG4gIHByaXZhdGUgdXNhZ2VDb3VudGVyID0gMFxuICBwcml2YXRlIGRlc3Ryb3lUaW1lb3V0OiBudW1iZXIgfCB1bmRlZmluZWRcbiAgcHJpdmF0ZSBldmVudEhhbmRsZXJzID0ge1xuICAgIHNjcm9sbFRvQnVmZmVyUmFuZ2U6IChbbWluLCBtYXhdOiBbbnVtYmVyLCBudW1iZXJdKSA9PiB7XG4gICAgICBpZiAobWluID09PSAwKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yLnNjcm9sbFRvQnVmZmVyUG9zaXRpb24oW21pbiwgMF0pXG4gICAgICB9IGVsc2UgaWYgKG1heCA+PSB0aGlzLmVkaXRvci5nZXRMYXN0QnVmZmVyUm93KCkgLSAxKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yLnNjcm9sbFRvQnVmZmVyUG9zaXRpb24oW21heCwgMF0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCByYW5nZSA9IFJhbmdlLmZyb21PYmplY3QoW1ttaW4sIDBdLCBbbWF4LCAwXV0pXG4gICAgICAgIHRoaXMuZWRpdG9yLnNjcm9sbFRvU2NyZWVuUmFuZ2UoXG4gICAgICAgICAgdGhpcy5lZGl0b3Iuc2NyZWVuUmFuZ2VGb3JCdWZmZXJSYW5nZShyYW5nZSksXG4gICAgICAgICAge1xuICAgICAgICAgICAgY2VudGVyOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICApXG4gICAgICB9XG4gICAgfSxcbiAgICBkZXN0cm95OiAoKSA9PiB7XG4gICAgICB0aGlzLnVzYWdlQ291bnRlciAtPSAxXG4gICAgICBpZiAodGhpcy51c2FnZUNvdW50ZXIgPD0gMCkge1xuICAgICAgICB0aGlzLnJlc2V0VGltZW91dCgpXG4gICAgICAgIHRoaXMuZGVzdHJveVRpbWVvdXQgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgdGhpcy5kZXN0cm95KClcbiAgICAgICAgfSwgdGhpcy5kZXN0cm95VGltZW91dExlbmd0aClcbiAgICAgIH1cbiAgICB9LFxuICAgIGluaXQ6ICgpID0+IHtcbiAgICAgIHRoaXMudXNhZ2VDb3VudGVyICs9IDFcbiAgICAgIHRoaXMucmVzZXRUaW1lb3V0KClcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBhdGg6IHRoaXMuZWRpdG9yLmdldFBhdGgoKSxcbiAgICAgICAgdGl0bGU6IHRoaXMuZWRpdG9yLmdldFRpdGxlKCksXG4gICAgICAgIGdyYW1tYXI6IHRoaXMuZWRpdG9yLmdldEdyYW1tYXIoKS5zY29wZU5hbWUsXG4gICAgICAgIHRleHQ6IHRoaXMuZWRpdG9yLmdldFRleHQoKSxcbiAgICAgIH1cbiAgICB9LFxuICAgIG9wZW5Tb3VyY2U6IChyb3c/OiBudW1iZXIpID0+IHtcbiAgICAgIGlmIChyb3cgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLmVkaXRvci5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbihbcm93LCAwXSlcbiAgICAgIH1cbiAgICAgIHJlbW90ZS5nZXRDdXJyZW50V2luZG93KCkuZm9jdXMoKVxuICAgICAgY29uc3QgcGFuZSA9IGF0b20ud29ya3NwYWNlLnBhbmVGb3JJdGVtKHRoaXMuZWRpdG9yKVxuICAgICAgaWYgKCFwYW5lKSByZXR1cm5cbiAgICAgIHBhbmUuYWN0aXZhdGVJdGVtKHRoaXMuZWRpdG9yKVxuICAgICAgcGFuZS5hY3RpdmF0ZSgpXG4gICAgfSxcbiAgfVxuXG4gIHByaXZhdGUgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBlZGl0b3I6IFRleHRFZGl0b3IpIHtcbiAgICB0aGlzLmRpc3Bvc2FibGVzLmFkZChcbiAgICAgIG5ldyBSZXF1ZXN0SGFuZGxlcih0aGlzLndpbmRvd0lkLCBlZGl0b3IuaWQsIHRoaXMuZXZlbnRIYW5kbGVycyksXG4gICAgKVxuICAgIHRoaXMuaGFuZGxlRWRpdG9yRXZlbnRzKClcbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgY3JlYXRlKGVkaXRvcjogVGV4dEVkaXRvcikge1xuICAgIGNvbnN0IHJlcyA9IFJlbW90ZUVkaXRvclNlcnZlci5lZGl0b3JNYXAuZ2V0KGVkaXRvcilcbiAgICBpZiAocmVzKSByZXR1cm4gcmVzXG4gICAgY29uc3QgbmV3UmVzID0gbmV3IFJlbW90ZUVkaXRvclNlcnZlcihlZGl0b3IpXG4gICAgUmVtb3RlRWRpdG9yU2VydmVyLmVkaXRvck1hcC5zZXQoZWRpdG9yLCBuZXdSZXMpXG4gICAgcmV0dXJuIG5ld1Jlc1xuICB9XG5cbiAgcHJpdmF0ZSBkZXN0cm95KCkge1xuICAgIFJlbW90ZUVkaXRvclNlcnZlci5lZGl0b3JNYXAuZGVsZXRlKHRoaXMuZWRpdG9yKVxuICAgIHRoaXMuZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG4gIH1cblxuICBwcml2YXRlIHJlc2V0VGltZW91dCgpIHtcbiAgICBpZiAodGhpcy5kZXN0cm95VGltZW91dCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMuZGVzdHJveVRpbWVvdXQpXG4gICAgICB0aGlzLmRlc3Ryb3lUaW1lb3V0ID0gdW5kZWZpbmVkXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBoYW5kbGVFZGl0b3JFdmVudHMoKSB7XG4gICAgdGhpcy5kaXNwb3NhYmxlcy5hZGQoXG4gICAgICB0aGlzLmVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZFN0b3BDaGFuZ2luZygoKSA9PiB7XG4gICAgICAgIGlmIChhdG9tQ29uZmlnKCkucHJldmlld0NvbmZpZy5saXZlVXBkYXRlKSB7XG4gICAgICAgICAgdGhpcy5lbWl0KCdjaGFuZ2VUZXh0JywgdGhpcy5lZGl0b3IuZ2V0VGV4dCgpKVxuICAgICAgICB9XG4gICAgICAgIGlmIChhdG9tQ29uZmlnKCkuc3luY0NvbmZpZy5zeW5jUHJldmlld09uQ2hhbmdlKSB7XG4gICAgICAgICAgdGhpcy5lbWl0KCdzeW5jUHJldmlldycsIHtcbiAgICAgICAgICAgIHBvczogdGhpcy5lZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKS5yb3csXG4gICAgICAgICAgICBmbGFzaDogZmFsc2UsXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgICB0aGlzLmVkaXRvci5vbkRpZENoYW5nZVBhdGgoKCkgPT4ge1xuICAgICAgICB0aGlzLmVtaXQoJ2NoYW5nZVBhdGgnLCB7XG4gICAgICAgICAgcGF0aDogdGhpcy5lZGl0b3IuZ2V0UGF0aCgpLFxuICAgICAgICAgIHRpdGxlOiB0aGlzLmVkaXRvci5nZXRUaXRsZSgpLFxuICAgICAgICB9KVxuICAgICAgfSksXG4gICAgICB0aGlzLmVkaXRvci5vbkRpZENoYW5nZUdyYW1tYXIoKGdyYW1tYXIpID0+IHtcbiAgICAgICAgdGhpcy5lbWl0KCdjaGFuZ2VHcmFtbWFyJywgZ3JhbW1hci5zY29wZU5hbWUpXG4gICAgICB9KSxcbiAgICAgIHRoaXMuZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgIHRoaXMuZGVzdHJveSgpXG4gICAgICAgIGlmIChhdG9tQ29uZmlnKCkucHJldmlld0NvbmZpZy5jbG9zZVByZXZpZXdXaXRoRWRpdG9yKSB7XG4gICAgICAgICAgdGhpcy5lbWl0KCdkZXN0cm95JywgdW5kZWZpbmVkKVxuICAgICAgICB9XG4gICAgICB9KSxcbiAgICAgIHRoaXMuZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkU2F2ZSgoKSA9PiB7XG4gICAgICAgIGlmICghYXRvbUNvbmZpZygpLnByZXZpZXdDb25maWcubGl2ZVVwZGF0ZSkge1xuICAgICAgICAgIHRoaXMuZW1pdCgnY2hhbmdlVGV4dCcsIHRoaXMuZWRpdG9yLmdldFRleHQoKSlcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgICB0aGlzLmVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZFJlbG9hZCgoKSA9PiB7XG4gICAgICAgIGlmICghYXRvbUNvbmZpZygpLnByZXZpZXdDb25maWcubGl2ZVVwZGF0ZSkge1xuICAgICAgICAgIHRoaXMuZW1pdCgnY2hhbmdlVGV4dCcsIHRoaXMuZWRpdG9yLmdldFRleHQoKSlcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgICBhdG9tLnZpZXdzLmdldFZpZXcodGhpcy5lZGl0b3IpLm9uRGlkQ2hhbmdlU2Nyb2xsVG9wKCgpID0+IHtcbiAgICAgICAgaWYgKCFzaG91bGRTY3JvbGxTeW5jKCdlZGl0b3InKSkgcmV0dXJuXG4gICAgICAgIGNvbnN0IFtmaXJzdCwgbGFzdF0gPSB0aGlzLmVkaXRvci5nZXRWaXNpYmxlUm93UmFuZ2UoKVxuICAgICAgICBjb25zdCBmaXJzdExpbmUgPSB0aGlzLmVkaXRvci5idWZmZXJSb3dGb3JTY3JlZW5Sb3coZmlyc3QpXG4gICAgICAgIGNvbnN0IGxhc3RMaW5lID0gdGhpcy5lZGl0b3IuYnVmZmVyUm93Rm9yU2NyZWVuUm93KGxhc3QpXG4gICAgICAgIHRoaXMuZW1pdCgnc2Nyb2xsU3luYycsIFtmaXJzdExpbmUsIGxhc3RMaW5lXSlcbiAgICAgIH0pLFxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQoYXRvbS52aWV3cy5nZXRWaWV3KHRoaXMuZWRpdG9yKSwge1xuICAgICAgICAnbWFya2Rvd24tcHJldmlldy1wbHVzOnN5bmMtcHJldmlldyc6ICgpID0+IHtcbiAgICAgICAgICB0aGlzLmVtaXQoJ3N5bmNQcmV2aWV3Jywge1xuICAgICAgICAgICAgcG9zOiB0aGlzLmVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpLnJvdyxcbiAgICAgICAgICAgIGZsYXNoOiB0cnVlLFxuICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICApXG4gIH1cblxuICBwcml2YXRlIGVtaXQ8VCBleHRlbmRzIGtleW9mIElQQ0V2ZW50cz4oZXZlbnQ6IFQsIGFyZzogSVBDRXZlbnRzW1RdKSB7XG4gICAgcmVtb3RlLmlwY01haW4uZW1pdCgnbWFya2Rvd24tcHJldmlldy1wbHVzOmVkaXRvci1ldmVudCcsIHtcbiAgICAgIGVkaXRvcklkOiB0aGlzLmVkaXRvci5pZCxcbiAgICAgIHdpbmRvd0lkOiB0aGlzLndpbmRvd0lkLFxuICAgICAgZXZlbnQsXG4gICAgICBhcmcsXG4gICAgfSlcbiAgfVxufVxuIl19