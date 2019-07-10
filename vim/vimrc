set backspace=start,eol,indent
set ruler
set nocompatible
set ignorecase
set smartcase
set incsearch
set hlsearch
set undofile
set undodir=~/.VIM_UNDO_FILES
set virtualedit=all
set number
set wildignore+=*/target/*

syntax enable

highlight ColorColumn ctermbg=magenta
" call matchadd('ColorColumn', '\%>80v', 100)

imap jk <esc>
nnoremap / /\v

filetype off

set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()

Plugin 'VundleVim/Vundle.vim'
Plugin 'scrooloose/nerdtree'
Plugin 'drmingdrmer/xptemplate'
Plugin 'derekwyatt/vim-scala'
Plugin 'ctrlpvim/ctrlp.vim'
Plugin 'airblade/vim-gitgutter'
Plugin 'vim-airline/vim-airline'
Plugin 'Shougo/neocomplete.vim'

call vundle#end()

filetype plugin indent on

"===============================================================================
" Make :help appear in a full-screen tab, instead of a window
"===============================================================================

	"Only apply to .txt files...
	augroup HelpInTabs
		autocmd!
		autocmd BufEnter  *.txt  call HelpInNewTab()
	augroup END

	"Only apply to help files...
	function! HelpInNewTab ()
		if &buftype == 'help'
			"Convert the help window to a tab...
			execute "normal \<C-W>T"
		endif
	endfunction	

		
