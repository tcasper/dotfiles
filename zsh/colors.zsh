autoload colors; colors

for COLOR in RED GREEN BLUE YELLOW MAGENTA CYAN BLACK WHITE; do
	eval PR_$COLOR='%{$fg_no_bold[${(L)COLOR}]%}'
	eval PR_BOLD_$COLOR='%{$fg_bold[${(L)COLOR}]%}'
done

eval RESET='$reset_color'
export PR_RED PR_GREEN PR_BLUE PR_YELLOW PR_WHITE PR_BLACK
export PR_BOLD_RED PR_BOLD_GREEN PR_BOLD_BLUE PR_BOLD_YELLOW PR_BOLD_WHITE PR_BOLD_BLACK

#Clear LSCOLORS
unset LSCOLORS

export CLICOLOR=1
export LS_COLORS=exfxcxdxbxegedabagacad
