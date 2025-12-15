import { App, Notice, Plugin, PluginSettingTab, Setting, TFile, MarkdownView } from "obsidian";

interface PluginSettings {
	targetFilePath: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
	targetFilePath: "",
};

export default class StickyNoteOpenerPlugin extends Plugin {
	settings: PluginSettings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon("sticky-note", "선택한 문서 열기", () => {
			this.openTargetFile();
		});

		this.addCommand({
			id: "open-target-file",
			name: "선택한 문서 열기",
			callback: () => this.openTargetFile(),
		});

		this.addSettingTab(new StickyNoteSettingTab(this.app, this));
	}

	async loadSettings() {
		const data = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async openTargetFile() {
		const path = this.settings.targetFilePath?.trim();
		if (!path) {
			new Notice("설정에서 열 문서를 먼저 선택하세요.");
			return;
		}

		const file = this.app.vault.getAbstractFileByPath(path);
		if (!(file instanceof TFile)) {
			new Notice("선택된 문서를 찾을 수 없습니다: " + path);
			return;
		}

		const markdownLeaves = this.app.workspace.getLeavesOfType("markdown");
		for (const leaf of markdownLeaves) {
			const view = leaf.view;
			if (view instanceof MarkdownView && view.file?.path === file.path) {
				this.app.workspace.setActiveLeaf(leaf, { focus: true });
				return;
			}
		}

		const leaf = this.app.workspace.getLeaf(false);
		await leaf.openFile(file);
	}
}

class StickyNoteSettingTab extends PluginSettingTab {
	plugin: StickyNoteOpenerPlugin;

	constructor(app: App, plugin: StickyNoteOpenerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("문서 경로")
			.setDesc("볼트 기준 경로를 입력하세요. 예: 폴더/노트.md")
			.addText((text) => {
				text.setPlaceholder("폴더/노트.md");
				text.setValue(this.plugin.settings.targetFilePath);
				text.onChange(async (value) => {
					const v = value.trim();
					this.plugin.settings.targetFilePath = v;
					await this.plugin.saveSettings();

					if (!v) {
						return;
					}

					const af = this.app.vault.getAbstractFileByPath(v);
					if (af instanceof TFile && af.extension === "md") {
						new Notice("선택된 문서: " + af.path);
					}
				});
			});
	}
}

