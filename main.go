package main

import (
	"fmt"
	"math"
	"os"
	"strconv"
	"strings"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/fogleman/ease"
	"github.com/lucasb-eyer/go-colorful"
)

const (
	progressBarWidth  = 50
	progressFullChar  = "█"
	progressEmptyChar = "░"
	progressColor1    = "#B14FFF"
	progressColor2    = "#00FFA3"
)

// General stuff for styling the view
var (
	subtleStyle   = lipgloss.NewStyle().Foreground(lipgloss.Color("241"))
	progressEmpty = subtleStyle.Render(progressEmptyChar)
	mainStyle     = lipgloss.NewStyle().MarginLeft(2)

	// Gradient colors we'll use for the progress bar
	ramp = makeRampStyles(progressColor1, progressColor2, progressBarWidth)

	progressMaxValue float64 = 1
)

type model struct {
	Chosen   bool
	Frames   int
	Progress float64
	Loaded   bool
}

func main() {
	// Check if a command line argument is provided
	if len(os.Args) != 2 {
		fmt.Println("Usage: go run . <progressMaxValue>")
		return
	}

	// Convert the argument to a float64
	var err error
	progressMaxValue, err = strconv.ParseFloat(os.Args[1], 64)
	if err != nil {
		fmt.Println("Invalid progressMaxValue. It should be a number.")
		return
	}

	initialModel := model{false, 0, 0, false}
	p := tea.NewProgram(initialModel)
	if _, err := p.Run(); err != nil {
		fmt.Println("could not start program:", err)
	}
}

type (
	frameMsg struct{}
)

func frame() tea.Cmd {
	return tea.Tick(time.Second/60, func(time.Time) tea.Msg {
		return frameMsg{}
	})
}

func (m model) Init() tea.Cmd {
	return frame()
}

// Main update function.
func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	// Make sure these keys always quit
	if msg, ok := msg.(tea.KeyMsg); ok {
		k := msg.String()
		if k == "q" || k == "esc" || k == "ctrl+c" {
			return m, tea.Quit
		}
	}
	return updateChosen(msg, m)
}

// The main view, which just calls the appropriate sub-view
func (m model) View() string {
	s := chosenView(m)
	return mainStyle.Render("\n" + s + "\n\n")
}

// Update loop for the second view after a choice has been made
func updateChosen(msg tea.Msg, m model) (tea.Model, tea.Cmd) {
	switch msg.(type) {
	case frameMsg:
		if !m.Loaded {
			m.Frames++
			m.Progress = ease.Linear(float64(m.Frames) / 100) // Adjusted the calculation for the new progressMaxValue
			if m.Progress >= progressMaxValue {
				m.Progress = progressMaxValue
				m.Loaded = true
				return m, nil
			}
			return m, frame()
		}
	}
	return m, nil
}

// The second view, after a task has been chosen
func chosenView(m model) string {
	return progressbar(m.Progress) + "%"
}

func progressbar(percent float64) string {
	w := float64(progressBarWidth)

	fullSize := int(math.Round(w * percent))
	var fullCells string
	for i := 0; i < fullSize; i++ {
		fullCells += ramp[i].Render(progressFullChar)
	}

	emptySize := int(w) - fullSize
	emptyCells := strings.Repeat(progressEmpty, emptySize)

	return fmt.Sprintf("%s%s %3.0f", fullCells, emptyCells, math.Round(percent*100))
}

// Utils

// Generate a blend of colors.
func makeRampStyles(colorA, colorB string, steps float64) (s []lipgloss.Style) {
	cA, _ := colorful.Hex(colorA)
	cB, _ := colorful.Hex(colorB)

	for i := 0.0; i < steps; i++ {
		c := cA.BlendLuv(cB, i/steps)
		s = append(s, lipgloss.NewStyle().Foreground(lipgloss.Color(colorToHex(c))))
	}
	return
}

// Convert a colorful.Color to a hexadecimal format.
func colorToHex(c colorful.Color) string {
	return fmt.Sprintf("#%s%s%s", colorFloatToHex(c.R), colorFloatToHex(c.G), colorFloatToHex(c.B))
}

// Helper function for converting colors to hex. Assumes a value between 0 and
// 1.
func colorFloatToHex(f float64) (s string) {
	s = strconv.FormatInt(int64(f*255), 16)
	if len(s) == 1 {
		s = "0" + s
	}
	return
}
