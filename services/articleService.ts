
import { Article } from '../types';

/**
 * 阿里云 RDS 后端 API 地址
 * 如果你在本地运行 server.js，请保持 http://localhost:3000/api
 */
const API_BASE_URL = 'http://localhost:3000/api'; 

/**
 * 通用 API 请求处理
 */
async function apiRequest(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export const articleService = {
  async getPasscode(): Promise<string> {
    return localStorage.getItem('admin_pass') || 'NNyymsy123!';
  },

  async setPasscode(newPasscode: string): Promise<void> {
    localStorage.setItem('admin_pass', newPasscode);
  },

  /**
   * 从后端 API (RDS) 获取文章
   */
  async fetchArticles(): Promise<Article[]> {
    return apiRequest('/articles');
  },

  /**
   * 保存文章到 RDS
   */
  async saveArticle(article: Omit<Article, 'viewCount' | 'createdAt'>): Promise<void> {
    try {
      await apiRequest('/articles', {
        method: 'POST',
        body: JSON.stringify(article),
      });
    } catch (err: any) {
      console.error("RDS 保存失败:", err);
      throw err;
    }
  },

  /**
   * 从 RDS 删除
   */
  async deleteArticle(id: string): Promise<void> {
    await apiRequest(`/articles/${id}`, { method: 'DELETE' });
  },

  /**
   * 增加阅读量
   */
  async incrementViewCount(id: string): Promise<void> {
    await apiRequest(`/articles/${id}/view`, { method: 'POST' });
  },

  async togglePublish(id: string, currentState: boolean): Promise<void> {
    // 简化处理，实际生产可增加 PATCH 路由
    console.log("Toggle publish for", id);
  }
};
