// All Qdrant operations must use wait: true

import { QDRANT_KEY, QDRANT_URL } from '$env/static/private';
import { QdrantClient } from '@qdrant/js-client-rest';
import { v7 as uuidv7 } from 'uuid';
import { collection } from '$lib/constants';
import type { User } from '$lib/types';
import { embed } from '$lib/util/embed';

export type PayloadFilter = Record<string, unknown>;

// Qdrant client configuration
export const qdrant = new QdrantClient({
	url: QDRANT_URL || 'http://localhost:6333',
	apiKey: QDRANT_KEY
});

export async function getfirst<T>(filters: PayloadFilter): Promise<T | null> {
	const results = await search_by_payload<T>(filters, null, 1);
	if (results.length > 0) {
		return results[0];
	}
	return null;
}

// Utility functions
export function generateId(): string {
	return uuidv7();
}

export const set = async (id: string, payload: Record<string, unknown>) => {
	await qdrant.setPayload('i', {
		wait: true,
		payload,
		points: [id]
	});
};

// Database operations wrapper
export async function edit_point<T>(i: string, data: T): Promise<T & { i: string }> {
	const vector = new Array(3072).fill(0);

	await qdrant.upsert(collection, {
		points: [
			{
				id: i,
				payload: { ...data },
				vector
			}
		],
		wait: true
	});

	return { ...data, i };
}

export async function create<T extends { s: string }>(
	payload: T,
	string_to_embed?: string,
	i?: string
): Promise<string> {
	const id = i || generateId();

	let vector: number[] = [];

	if (string_to_embed) {
		vector = await embed(string_to_embed);
	} else {
		vector = new Array(3072).fill(0);
	}

	await qdrant.upsert(collection, {
		points: [
			{
				id,
				payload,
				vector
			}
		],
		wait: true
	});

	return id;
}

export const format_filter = (filters: PayloadFilter) => {
	return {
		must: Object.entries(filters)
			.filter(([, value]) => value !== undefined && value !== null && value !== '')
			.map(([key, value]) => ({
				key,
				match: { value }
			}))
	};
};

export async function search_by_payload<T>(
	filter: PayloadFilter,
	with_payload?: string[] | boolean,
	limit?: number,
	order_by?: string | Record<string, string>,
): Promise<T[]> {
	const actual_limit = limit || 144;
	try {
		const results = await qdrant.scroll(collection, {
			filter: format_filter(filter),
			limit: actual_limit,
			with_payload,
			...(order_by && { order_by }),
			with_vector: false
		});

		// console.debug('search_by_payload results', results);

		return results.points.map((point) => ({ ...(point.payload as T), i: point.id }));
	} catch (error) {
		console.error('Error in search_by_payload:', error);
		console.error('arg:', filter, with_payload, limit, order_by);
		throw error;
	}
}

export async function search_by_vector<T>({
	vector,
	limit = 54,
	with_payload,
	filter
}: {
	vector: number[];
	with_payload?: string[];
	limit?: number;
	filter?: Record<string, unknown>;
}): Promise<T[]> {
	try {
		const searchParams: Record<string, unknown> = {
			vector,
			limit,
			with_payload,
			with_vector: false
		};

		if (filter) {
			searchParams.filter = format_filter(filter);
		}

		const results = await qdrant.search(collection, searchParams);

		return results.map((point) => ({ ...(point.payload as T), i: point.id }));
	} catch (error) {
		console.error('Error in search_by_vector:', error);
		console.error('Vector length:', vector.length);
		console.error('Filter:', filter);
		throw error;
	}
}

export async function get<T>(
	id: string,
	payload?: string[] | string | boolean,
	with_vector?: boolean
): Promise<T | null> {
	try {
		const result = await qdrant.retrieve(collection, {
			ids: [id],
			with_payload: typeof payload === 'string' ? [payload] : payload,
			with_vector
		});

		if (result.length > 0) {
			const res = result[0].payload as T & { vector: number[] };
			if (with_vector) {
				res.vector = result[0].vector;
			} else if (payload && result[0].payload && typeof payload === 'string') {
				return result[0].payload[payload] as T;
			}
			return res;
		}
		return null;
	} catch {
		return null;
	}
}

export async function delete_by_id(id: string): Promise<void> {
	await qdrant.delete(collection, {
		points: [id],
		wait: true
	});
}

export async function update_point<T>(id: string, data: Partial<T>): Promise<void> {
	const existing = await get<T>(id);
	if (!existing) {
		throw new Error('Document not found');
	}

	await edit_point(id, { ...existing, ...data });
}

export const exists = async (i: string): Promise<boolean> => {
	return !!(await get(i, []));
};

// Get username from their ID
export async function get_username_from_id(userId: string): Promise<string> {
	const user = await get<{ u?: string }>(userId);

	if (user && user.u) {
		return user.u;
	}

	// If user not found, return Unknown User
	return 'Unknown User';
}

export const find_user_by_tag = async (t: string) => {
	return (await search_by_payload<User>({ s: 'u', t }))[0];
};

export const delete_ = async (id: string): Promise<void> => {
	await qdrant.delete(collection, {
		wait: true,
		points: [id]
	});
};
