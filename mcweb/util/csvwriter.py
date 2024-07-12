class CSVWriterHelper:

    def __init__(self):
        pass

    @staticmethod
    def write_attn_over_time(writer, data, columns):
        writer.writerow(columns)
        for day in data["counts"]:
            if 'ratio' in day:
                writer.writerow([day["date"], day["count"],
                                day["total_count"], day["ratio"]])
            else:
                writer.writerow([day["date"], day["count"]])
        return writer
    
    ## CSVWriter.write_attn_over_time()

    @staticmethod
    def write_top_langs(writer, data, columns):
        writer.writerow(columns)
        for top_lang in data:
            writer.writerow([top_lang["language"], top_lang["value"], top_lang['ratio']])

    @staticmethod
    def write_top_words(writer, data, columns):
        writer.writerow(columns)
        for top_terms in data:
            writer.writerow([top_terms["term"], top_terms["count"], top_terms['ratio']])

    @staticmethod
    def write_top_sources(writer, data, columns):
        writer.writerow(columns)
        for top_source in data:
            writer.writerow([top_source["source"], top_source["count"]])