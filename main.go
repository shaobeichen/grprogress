package main

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/charmbracelet/bubbles/progress"
	tea "github.com/charmbracelet/bubbletea"
)

const (
	padding  = 2
	maxWidth = 80
)

type tickMsg time.Time

type model struct {
	progress     progress.Model
	target       float64
	stepDuration time.Duration
	increment    float64
}

func main() {
	target, err := strconv.ParseFloat(os.Args[1], 64)
	if err != nil || target < 0 || target > 1 {
		fmt.Println("Invalid target value. Please provide a value between 0 and 1.")
		return
	}

	durationMs, err := strconv.Atoi(os.Args[2])
	if err != nil || durationMs <= 0 {
		fmt.Println("Invalid duration. Please provide a positive integer in milliseconds.")
		return
	}

	m := model{
		progress:     progress.New(progress.WithDefaultGradient()),
		target:       target,
		stepDuration: time.Duration(durationMs) * time.Millisecond,
		increment:    1.0 / (float64(durationMs) / 100), // 每 100ms 增加一次
	}

	if _, err := tea.NewProgram(m).Run(); err != nil {
		fmt.Println("Oh no!", err)
		os.Exit(1)
	}
}

func (m model) Init() tea.Cmd {
	return tickCmd(m.stepDuration)
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		return m, tea.Quit

	case tea.WindowSizeMsg:
		m.progress.Width = msg.Width - padding*2 - 4
		if m.progress.Width > maxWidth {
			m.progress.Width = maxWidth
		}
		return m, nil

	case tickMsg:
		fmt.Println(m.progress.Percent(), m.target)
		if m.progress.Percent() >= m.target {
			return m, tea.Quit
		}
		cmd := m.progress.IncrPercent(m.increment)
		return m, tea.Batch(tickCmd(m.stepDuration), cmd)

	default:
		progressModel, cmd := m.progress.Update(msg)
		m.progress = progressModel.(progress.Model)
		return m, cmd
	}
}

func (m model) View() string {
	pad := strings.Repeat(" ", padding)
	return "\n" +
		pad + m.progress.View() + "\n"
}

func tickCmd(d time.Duration) tea.Cmd {
	return tea.Tick(d, func(t time.Time) tea.Msg {
		return tickMsg(t)
	})
}
