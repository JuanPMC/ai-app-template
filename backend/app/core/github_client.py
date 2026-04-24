from __future__ import annotations

from github import Github, GithubException
from github.ContentFile import ContentFile
from github.Repository import Repository

from app.core.config import Settings, get_settings


class GitHubClient:
    """Wraps PyGithub for repo file/folder operations."""

    def __init__(self, settings: Settings) -> None:
        self._gh = Github(settings.github_token)
        self._repo: Repository = self._gh.get_repo(settings.github_repo)
        self.branch = settings.github_branch
        self.base_path = settings.features_base_path.rstrip("/")

    @property
    def repo(self) -> Repository:
        return self._repo

    def _full_path(self, path: str) -> str:
        """Prepend base_path to a relative path."""
        if path:
            return f"{self.base_path}/{path}"
        return self.base_path

    # ── Read operations ──────────────────────────────────────────────

    def list_contents(self, path: str = "") -> list[ContentFile]:
        """List files and directories at *path* (relative to base_path)."""
        full = self._full_path(path)
        try:
            contents = self._repo.get_contents(full, ref=self.branch)
        except GithubException as exc:
            if exc.status == 404:
                return []
            raise
        if isinstance(contents, list):
            return contents
        return [contents]

    def get_file_content(self, path: str) -> tuple[str, str]:
        """Return ``(decoded_utf8_content, sha)`` for the file at *path*."""
        full = self._full_path(path)
        content_file = self._repo.get_contents(full, ref=self.branch)
        if isinstance(content_file, list):
            raise ValueError(f"Expected a file but got a directory: {full}")
        decoded = content_file.decoded_content.decode("utf-8")
        return decoded, content_file.sha

    # ── Write operations ─────────────────────────────────────────────

    def create_file(self, path: str, content: str, message: str) -> None:
        full = self._full_path(path)
        self._repo.create_file(full, message, content, branch=self.branch)

    def update_file(self, path: str, content: str, sha: str, message: str) -> None:
        full = self._full_path(path)
        self._repo.update_file(full, message, content, sha, branch=self.branch)

    def delete_file(self, path: str, sha: str, message: str) -> None:
        full = self._full_path(path)
        self._repo.delete_file(full, message, sha, branch=self.branch)

    # ── Folder operations ────────────────────────────────────────────

    def create_folder(self, path: str, message: str) -> None:
        """Create a folder by placing a ``.gitkeep`` file inside it."""
        gitkeep = f"{path}/.gitkeep"
        self.create_file(gitkeep, "", message)

    def delete_folder(self, path: str, message: str) -> None:
        """Recursively delete every file inside *path*."""
        contents = self.list_contents(path)
        for item in contents:
            # item.path is the full repo path; we need relative to base_path
            relative = item.path.removeprefix(f"{self.base_path}/")
            if item.type == "dir":
                self.delete_folder(relative, message)
            else:
                self.delete_file(relative, item.sha, message)


def get_github_client() -> GitHubClient:
    return GitHubClient(get_settings())
